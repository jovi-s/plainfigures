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

"""Financial coordinator: provide reasonable investment strategies"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from dotenv import load_dotenv
import os

from . import prompt
from .sub_agents.cashflow_analyst import cashflow_agent
from .sub_agents.invoice_analyst import invoice_analyst_agent
from .tools.finance_tools import (
    
)


load_dotenv()


TEXT_IMAGE_MODEL: str = os.getenv("TEXT_IMAGE_MODEL", "gpt-4o-mini")
TRANSCRIBE_MODEL: str = os.getenv("TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")


financial_coordinator = LlmAgent(
    name="financial_coordinator",
    model=TEXT_IMAGE_MODEL,
    description=(
        "assistant that helps small business owners track cash flow, "
        "generate invoices, and manage expenses "
        "by coordinating specialized subagents for each task."
    ),
    instruction=prompt.FINANCIAL_COORDINATOR_PROMPT,
    output_key="financial_coordinator_output",
    tools=[
        AgentTool(agent=cashflow_agent),
        AgentTool(agent=invoice_analyst_agent),

    ],
)

root_agent = financial_coordinator
