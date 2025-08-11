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

"""InvoiceAgent for creating and managing invoices"""

from google.adk import Agent
from google.adk.models.lite_llm import LiteLlm

from . import prompt
from ...tools.finance_tools import (
    create_invoice,
    render_invoice_pdf,
    mark_invoice_paid,
)

MODEL = "gpt-4o-mini"

invoice_analyst_agent = Agent(
    model=LiteLlm(model=f"openai/{MODEL}"),
    name="invoice_analyst_agent",
    instruction=prompt.INVOICE_ANALYST_PROMPT,
    output_key="invoice_agent_output",
    tools=[create_invoice, render_invoice_pdf, mark_invoice_paid],
)
