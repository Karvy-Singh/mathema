import json
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

llm = ChatOpenAI(model="gpt-5-mini", temperature=0)


async def structured(prompt: str, schema: type[BaseModel]):
    response = await llm.ainvoke(prompt)
    text = response.content.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    data = json.loads(text)
    return schema.model_validate(data)
