import unittest
import uuid
from datetime import datetime, timezone

from app.api.v1.routes.chats import _persist_automated_reply
from app.services.support_automation import AutomatedSupportReply, get_automated_support_reply


class TrackingSession:
    def __init__(self):
        self.added = []
        self.commits = 0

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.commits += 1

    def refresh(self, value):
        value.id = uuid.uuid4()
        value.created_at = datetime.now(timezone.utc)


class SupportAutomationTests(unittest.TestCase):
    def test_answers_common_help_center_topics(self):
        cases = {
            "Do you accept cash on delivery?": "payments",
            "Can this be delivered on the same day?": "delivery",
            "How long do you retain my personal data?": "privacy",
            "Can I get a refund if I cancel?": "refunds",
            "Where can I track my order status?": "tracking",
            "Can I customize my bouquet?": "customization",
        }

        for message, expected_topic in cases.items():
            with self.subTest(message=message):
                reply = get_automated_support_reply(message)
                self.assertIsNotNone(reply)
                self.assertEqual(reply.topic, expected_topic)
                self.assertTrue(reply.message)

    def test_prefers_current_help_center_answer_when_question_matches(self):
        settings = {
            "__faq__": [{
                "category": "Delivery",
                "items": [{
                    "q": "Do you deliver funeral flowers on Sundays?",
                    "a": "Sunday funeral deliveries require confirmation from the selected branch.",
                }],
            }],
        }

        reply = get_automated_support_reply(
            "Can you deliver funeral flowers on Sunday?",
            settings,
        )

        self.assertIsNotNone(reply)
        self.assertEqual(
            reply.message,
            "Sunday funeral deliveries require confirmation from the selected branch.",
        )

    def test_exact_short_cms_question_receives_its_configured_answer(self):
        settings = {
            "__faq__": [{
                "category": "Testing",
                "items": [
                    {"q": "Tester", "a": "Uppercase test answer."},
                    {"q": "tester", "a": "Lowercase test answer."},
                ],
            }],
        }

        uppercase_reply = get_automated_support_reply("Tester", settings)
        lowercase_reply = get_automated_support_reply("tester", settings)

        self.assertEqual(uppercase_reply.message, "Uppercase test answer.")
        self.assertEqual(lowercase_reply.message, "Lowercase test answer.")

    def test_human_support_request_is_not_automated(self):
        self.assertIsNone(get_automated_support_reply("Please let me talk to a human agent"))

    def test_automated_reply_is_persisted_as_chat_history(self):
        session = TrackingSession()
        user_id = uuid.uuid4()
        reply = AutomatedSupportReply("You can track it in My Orders.", "tracking")

        saved = _persist_automated_reply(session, user_id, reply)

        self.assertEqual(session.commits, 1)
        self.assertEqual(session.added, [saved])
        self.assertEqual(saved.user_id, user_id)
        self.assertEqual(saved.message, reply.message)
        self.assertEqual(saved.context_id, "support-automation:tracking")
        self.assertEqual(saved.sender, "staff")


if __name__ == "__main__":
    unittest.main()
