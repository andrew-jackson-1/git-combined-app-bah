import os
import time
import pandas as pd
from dotenv import load_dotenv
import streamlit as st
from databricks.sdk import WorkspaceClient

load_dotenv()
DATABRICKS_WORKSPACE = os.getenv('DATABRICKS_WORKSPACE')
GENIE_SPACE = os.getenv('GENIE_SPACE_ID')
# DATABRICKS_PAT = os.getenv('DATABRICKS_PAT')

workspace = WorkspaceClient(
    # host = DATABRICKS_WORKSPACE,
    # token = DATABRICKS_PAT,
    # auth_type="pat",
)

# --- New: read query params and build initial content ---
query_params = st.experimental_get_query_params()
table_name = query_params.get("tableName", [None])[0]
columns = query_params.get("columns", [None])[0]
storage = query_params.get("storage", [None])[0]

initial_content = ""
if table_name:
    parts = [f"Inspecting table: {table_name}"]
    if columns:
        parts.append(f"Columns: {columns}")
    if storage:
        parts.append(f"Storage: {storage}")
    initial_content = "\n".join(parts)
# --- end new code ---

if "conversation_id" not in st.session_state:
    # Start conversation; include initial content if provided
    first_msg = workspace.genie.start_conversation_and_wait(
        space_id=GENIE_SPACE,
        content=initial_content or ""
    )
    st.session_state.conversation_id = first_msg.conversation_id
    st.session_state.messages = []

conversation_id = st.session_state.conversation_id

def get_text_from_message(msg):
    """Extract assistant text from attachments, fallback to query description or SQL."""
    texts = []
    for att in getattr(msg, "attachments", []) or []:
        if getattr(att, "text", None) and getattr(att.text, "content", None):
            texts.append(att.text.content)
        elif getattr(att, "query", None):
            desc = getattr(att.query, "description", None)
            if desc:
                texts.append(desc)
            else:
                # fallback: show SQL itself
                texts.append(att.query.query)
    return "\n\n".join(texts)

def extract_sql(msg):
    """Extract SQL statements and attachment IDs safely."""
    sql_list = []
    for att in getattr(msg, "attachments", []) or []:
        if getattr(att, "query", None):
            att_id = getattr(att, "id", None)
            sql_list.append((att_id, att.query.query))
    return sql_list

def get_inline_query_result(msg):
    """Return a DataFrame if the message has inline query_result."""
    qr = getattr(msg, "query_result", None)
    if qr and getattr(qr, "rows", None):
        columns = [c.name for c in qr.schema]
        return pd.DataFrame(qr.rows, columns=columns)
    return None

def fetch_query_result(att_id, msg):
    """Fetch SQL query result for attachments with an ID."""
    if att_id is None:
        return None
    result = workspace.genie.get_message_attachment_query_result(
        space_id=GENIE_SPACE,
        conversation_id=conversation_id,
        message_id=msg.message_id,
        attachment_id=att_id
    )
    if getattr(result, "statement_response", None):
        rows = result.statement_response.rows
        columns = [c.name for c in result.statement_response.schema]
        return pd.DataFrame(rows, columns=columns)
    return None

st.title("Genie Demo")

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        if msg["role"] == "user":
            st.markdown(msg["content"])
        else:
            # assistant turn
            if msg.get("text"):
                st.markdown(msg["text"])
            for sql in msg.get("sql", []):
                with st.expander("Generated SQL"):
                    st.code(sql, language="sql")
            for df in msg.get("tables", []):
                st.dataframe(df)

# User input
prompt = st.chat_input("Ask a data question")

if prompt:
    # Display user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Send message to Genie and wait for full response
    msg = workspace.genie.create_message_and_wait(
        space_id=GENIE_SPACE,
        conversation_id=conversation_id,
        content=prompt
    )

    # Extract assistant text
    text_resp = get_text_from_message(msg)

    # Extract SQL attachments
    sql_list = extract_sql(msg)

    # Fetch query results
    tables = []

    # 1️⃣ Try inline query_result
    inline_df = get_inline_query_result(msg)
    if inline_df is not None:
        tables.append(inline_df)

    # 2️⃣ Fetch results from attachments with ID
    for att_id, _ in sql_list:
        df = fetch_query_result(att_id, msg)
        if df is not None:
            tables.append(df)

    # Store assistant turn in session state
    st.session_state.messages.append({
        "role": "assistant",
        "text": text_resp,
        "sql": [sql for _, sql in sql_list],
        "tables": tables
    })

    # Display assistant turn
    with st.chat_message("assistant"):
        if text_resp:
            st.markdown(text_resp)
        for _, sql in sql_list:
            with st.expander("Generated SQL"):
                st.code(sql, language="sql")
        for df in tables:
            st.dataframe(df)