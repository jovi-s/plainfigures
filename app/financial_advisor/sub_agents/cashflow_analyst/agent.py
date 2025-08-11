# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""CashflowAgent for recording transactions and summarizing cashflow"""

from google.adk import Agent

from . import prompt
from ...tools.finance_tools import (
    load_customers,
    load_suppliers,
    record_transaction,
    summarize_cashflow,
)

MODEL = "gemini-2.5-pro"

cashflow_agent = Agent(
    model=MODEL,
    name="cashflow_agent",
    instruction=prompt.CASHFLOW_AGENT_PROMPT,
    output_key="cashflow_agent_output",
    tools=[load_customers, load_suppliers, record_transaction, summarize_cashflow],
)
