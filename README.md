# Pan-SEA AI Developer Challenge 2025 FINANCE

- https://github.com/google-gemini/gemini-fullstack-langgraph-quickstart

Financial Inclusion:

A lightweight, LLM-driven assistant that helps small business owners track cash flow, generate invoices, manage expenses, ... and explore microfinancing options.

A conversational chatbot powered by SEA-LION that explains fundamental financial concepts (e.g. budgeting, saving, digital payments, interest rates) in local Southeast Asian languages and dialects.

An LLM-related solution that explains loan application criteria (and recommends suitable financial products based on user profile)—all in regional languages.

Financial Trust:

An LLM-related solution that reads and summarizes complex bank or insurance documents into understandable, localized language—clarifying fees, terms, and risks.

(A chatbot that informs users of their rights regarding loans, digital payments, and banking services based on country-specific financial regulations.)

income = money coming in

expenses = money going out

Asset = something that puts money in your pocket

Liability = something that takes money out of your pocket

cash flow = asset -> income

## Overview

The Financial Advisor is a team of specialized AI agents that assists human financial advisors.

1. Cashflow Agent: 

2. Invoice Agent: 

## Setup and Installation

1.  **Prerequisites**

    *   Python 3.11+
    *   uv

        ```bash
        pip install uv
        ```

    * A project on Google Cloud Platform
    * Google Cloud CLI
        *   For installation, please follow the instruction on the official
            [Google Cloud website](https://cloud.google.com/sdk/docs/install).

2.  **Installation**

    ```bash
    # Install the package and dependencies.
    uv install
    ```


## Running the Agent

**Using `adk`**

ADK provides convenient ways to bring up agents locally and interact with them.
You may talk to the agent using the CLI:

```bash
adk run financial_advisor
```

Or on a web interface:

```bash
 adk web
```

The command `adk web` will start a web server on your machine and print the URL.
You may open the URL, select "financial_advisor" in the top-left drop-down menu, and
a chatbot interface will appear on the right. The conversation is initially
blank. Here are some example requests you may ask the Financial Advisor to verify:

```
who are you
```

## Running Tests [NOT IMPLEMENTED]

For running tests and evaluation, install the extra dependencies:

```bash
poetry install --with dev
```

Then the tests and evaluation can be run from the `financial-advisor` directory using
the `pytest` module:

```bash
python3 -m pytest tests
python3 -m pytest eval
```

`tests` runs the agent on a sample request, and makes sure that every component
is functional. `eval` is a demonstration of how to evaluate the agent, using the
`AgentEvaluator` in ADK. It sends a couple requests to the agent and expects
that the agent's responses match a pre-defined response reasonably well.


## Deployment [NOT IMPLEMENTED]

The Financial Advisor can be deployed to Vertex AI Agent Engine using the following
commands:

```bash
poetry install --with deployment
python3 deployment/deploy.py --create
```

When the deployment finishes, it will print a line like this:

```
Created remote agent: projects/<PROJECT_NUMBER>/locations/<PROJECT_LOCATION>/reasoningEngines/<AGENT_ENGINE_ID>
```

If you forgot the AGENT_ENGINE_ID, you can list existing agents using:

```bash
python3 deployment/deploy.py --list
```

To delete the deployed agent, you may run the following command:

```bash
python3 deployment/deploy.py --delete --resource_id=${AGENT_ENGINE_ID}
```