import json
from types import SimpleNamespace

from src.classify import OUTPUT_SCHEMA, classify_ticket, output_path


def test_output_schema_requires_only_the_expected_fields():
    assert OUTPUT_SCHEMA["additionalProperties"] is False
    assert set(OUTPUT_SCHEMA["required"]) == set(OUTPUT_SCHEMA["properties"])
    assert len(OUTPUT_SCHEMA["properties"]["category"]["enum"]) == 8
    assert OUTPUT_SCHEMA["properties"]["order_id_mentioned"]["type"] == "string"
    assert OUTPUT_SCHEMA["properties"]["contains_pii"]["type"] == "boolean"


def test_classify_ticket_requests_structured_json_and_returns_usage():
    prediction = {
        "category": "สอบถามทั่วไป",
        "sentiment": "กลาง",
        "urgency": "ปกติ",
        "order_id_mentioned": "",
        "contains_pii": False,
    }

    class FakeMessages:
        def create(self, **kwargs):
            assert kwargs["output_config"]["format"]["type"] == "json_schema"
            assert kwargs["output_config"]["format"]["schema"] is OUTPUT_SCHEMA
            return SimpleNamespace(
                content=[SimpleNamespace(type="text", text=json.dumps(prediction))],
                usage=SimpleNamespace(input_tokens=34, output_tokens=21),
            )

    client = SimpleNamespace(messages=FakeMessages())
    actual, input_tokens, output_tokens = classify_ticket(
        client, "test-model", "system prompt", "ลูกค้าถามข้อมูลสินค้า"
    )

    assert actual == prediction
    assert (input_tokens, output_tokens) == (34, 21)


def test_output_path_makes_model_name_filename_safe():
    path = output_path("provider/model name")

    assert path.name == "pred_provider-model-name.csv"
    assert path.parent.name == "out"
