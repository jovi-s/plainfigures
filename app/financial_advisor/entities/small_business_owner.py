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
"""Small Business Owner entity module for Southeast Asia plainfigures."""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


class BusinessAddress(BaseModel):
    """
    Represents a business's address.
    """

    street: str
    city: str
    province_or_state: str
    postal_code: str
    country: str
    model_config = ConfigDict(from_attributes=True)


class FinancialChallenge(BaseModel):
    """
    Represents a financial challenge faced by the SME.
    """

    description: str
    severity: str  # e.g., "low", "medium", "high"
    model_config = ConfigDict(from_attributes=True)


class ExpenseCategory(BaseModel):
    """
    Represents an expense category for the SME.
    """

    name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class BankingRelationship(BaseModel):
    """
    Represents the SME's banking relationship.
    """

    bank_name: str
    relationship_years: int
    model_config = ConfigDict(from_attributes=True)


class TechnologyAdoption(BaseModel):
    """
    Represents the SME's technology adoption level.
    """

    level: str  # e.g., "Low", "Medium", "High"
    tools_used: List[str]
    model_config = ConfigDict(from_attributes=True)


class SMEProfile(BaseModel):
    """
    Represents a small business owner's profile in Southeast Asia.
    """

    company_name: str
    owner_name: str
    industry: str
    country: str
    employees: int
    annual_revenue_usd: float
    years_in_business: int
    primary_business_activity: str
    current_financial_challenges: List[FinancialChallenge]
    cash_flow_frequency: str  # e.g., "Daily", "Weekly", "Monthly"
    invoice_volume_monthly: int
    expense_categories: List[ExpenseCategory]
    microfinancing_interest: str  # e.g., "Low", "Medium", "High"
    credit_score: str  # e.g., "Good", "Fair", "Limited"
    banking_relationship: BankingRelationship
    technology_adoption: TechnologyAdoption
    financial_goals: List[str]
    business_address: BusinessAddress
    contact_email: str
    contact_phone: str
    preferred_language: str = "en"
    recent_activity: List[str] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

    def to_json(self) -> str:
        """
        Converts the SMEProfile object to a JSON string.

        Returns:
            A JSON string representing the SMEProfile object.
        """
        return self.model_dump_json(indent=4)

    @staticmethod
    def get_profile(company_name: str = "Sunrise Trading Co") -> Optional["SMEProfile"]:
        """
        Retrieves a small business owner profile based on company name.

        Args:
            company_name: The name of the company to retrieve.

        Returns:
            The SMEProfile object if found, None otherwise.
        """
        # In a real application, this would involve a database lookup.
        # For this example, we'll just return a sample SME profile for Southeast Asia.
        return SMEProfile(
            company_name=company_name,
            owner_name="Tan Wei Ming",
            industry="Import/Export",
            country="Singapore",
            employees=25,
            annual_revenue_usd=850000,
            years_in_business=8,
            primary_business_activity="Importing electronics from China and distributing across Southeast Asia",
            current_financial_challenges=[
                FinancialChallenge(
                    description="Seasonal cash flow gaps", severity="high"
                ),
                FinancialChallenge(
                    description="Delayed customer payments", severity="medium"
                ),
                FinancialChallenge(
                    description="Currency fluctuation risks", severity="medium"
                ),
            ],
            cash_flow_frequency="Weekly",
            invoice_volume_monthly=45,
            expense_categories=[
                ExpenseCategory(name="Inventory"),
                ExpenseCategory(name="Shipping"),
                ExpenseCategory(name="Staff salaries"),
                ExpenseCategory(name="Office rent"),
                ExpenseCategory(name="Marketing"),
            ],
            microfinancing_interest="High",
            credit_score="Good",
            banking_relationship=BankingRelationship(
                bank_name="DBS Bank", relationship_years=5
            ),
            technology_adoption=TechnologyAdoption(
                level="Medium",
                tools_used=["Accounting software", "Online banking"],
            ),
            financial_goals=[
                "Improve cash flow predictability",
                "Reduce payment collection time",
                "Expand inventory financing",
            ],
            business_address=BusinessAddress(
                street="88 Market Street",
                city="Singapore",
                province_or_state="Central",
                postal_code="048948",
                country="Singapore",
            ),
            contact_email="owner@sunrisetrading.sg",
            contact_phone="+65-6123-4567",
            preferred_language="en",
            recent_activity=[],
        )