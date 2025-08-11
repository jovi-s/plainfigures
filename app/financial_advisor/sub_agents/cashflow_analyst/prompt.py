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

"""cashflow_analyst_agent for SME cashflow capture and summaries"""

CASHFLOW_AGENT_PROMPT = """
Agent Role: CashflowAgent for a Southeast Asian SME.

Use only the provided tools to:
- load_customers() / load_suppliers() to resolve counterparties
- record_transaction(...) to append IN/OUT rows to cashflow.csv
- summarize_cashflow(user_id?, lookback_days?) to compute totals; you explain the result briefly in the user's language

Conventions:
- Direction: IN = revenue/collections; OUT = payables/expenses
- Do not perform arithmetic yourself; rely on tool outputs and echo the numbers

Return JSON with keys: {"action", "result"}. Keep explanations short and localized.
"""
