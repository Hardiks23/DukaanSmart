import sys
import json

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("==================================================")
    print("  DUKAANSMART FULL-STACK BACKEND VERIFICATION   ")
    print("==================================================")
    client = TestClient(app)

    # 1. Health & Hindsight Status
    print("\n1. Testing /api/health and Hindsight status...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print("   ✓ Health check passed!")
    print(f"     Product: {health_data['product']}")
    print(f"     Team: {health_data['team']}")
    print(f"     Hindsight Mode: {health_data['hindsight']['mode']}")

    # 2. Dashboard Metrics
    print("\n2. Testing /api/dashboard/metrics...")
    res = client.get("/api/dashboard/metrics")
    assert res.status_code == 200
    metrics = res.json()
    print(f"   ✓ Today's Revenue: Rs {metrics['today_revenue']:,.2f}")
    print(f"   ✓ All-time Gross Profit: Rs {metrics['estimated_gross_profit_all_time']:,.2f}")
    print(f"   ✓ Inventory Value: Rs {metrics['total_inventory_cost_value']:,.2f}")
    print(f"   ✓ Low Stock Items: {metrics['low_stock_count']}")
    print(f"   ✓ Outstanding Udhar: Rs {metrics['outstanding_credit']:,.2f}")

    # 3. Products
    print("\n3. Testing /api/products...")
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) > 0, "No products found in DB"
    sample_prod = products[0]
    print(f"   ✓ Retrieved {len(products)} products (Sample: {sample_prod['name']} @ Rs {sample_prod['selling_price']})")

    # 4. Customers & Khata
    print("\n4. Testing /api/customers...")
    res = client.get("/api/customers")
    assert res.status_code == 200
    customers = res.json()
    assert len(customers) > 0, "No customers found in DB"
    sample_cust = customers[0]
    print(f"   ✓ Retrieved {len(customers)} customers (Sample: {sample_cust['name']}, Udhar: Rs {sample_cust['current_balance']})")

    # 5. POS Sale Creation
    print("\n5. Testing /api/sales POS Checkout...")
    sale_payload = {
        "customer_id": None,
        "customer_name": "Counter Test Buyer",
        "payment_method": "UPI",
        "discount_amount": 0.0,
        "tax_amount": 0.0,
        "items": [
            {
                "product_id": sample_prod["id"],
                "quantity": 1,
                "discount": 0.0
            }
        ]
    }
    res = client.post("/api/sales", json=sale_payload)
    assert res.status_code == 200, f"Sale failed: {res.text}"
    sale_data = res.json()
    print(f"   ✓ Sale recorded! Invoice: {sale_data['invoice_no']}, Total: Rs {sale_data['total_amount']}")

    # 6. Hindsight Retain
    print("\n6. Testing /api/hindsight/retain...")
    retain_payload = {
        "content": "Test Kirana Event: Customer bought 5 bags of Fortune Oil anticipating festival price surge.",
        "context": "Verification Test",
        "tags": ["test_event", "oil_surge"]
    }
    res = client.post("/api/hindsight/retain", json=retain_payload)
    assert res.status_code == 200
    print(f"   ✓ Memory retained into Hindsight bank successfully! (Mode: {res.json().get('mode')})")

    # 7. Hindsight Recall (4-Strategy)
    print("\n7. Testing /api/hindsight/recall (Multi-Strategy Retrieval)...")
    recall_payload = {
        "query": "Ramesh credit repayment track record",
        "budget": "mid"
    }
    res = client.post("/api/hindsight/recall", json=recall_payload)
    assert res.status_code == 200
    recall_data = res.json()
    print(f"   ✓ Recalled {recall_data['total_memories']} memories!")
    if recall_data['results']:
        top = recall_data['results'][0]
        print(f"     Top Fact: {top['text'][:80]}... (Strategy: {top['strategy']}, Score: {top['score']})")

    # 8. Hindsight Reflect
    print("\n8. Testing /api/hindsight/reflect (Agentic Reflection Loop)...")
    reflect_payload = {
        "query": "What are our historical patterns on credit risk?",
        "budget": "low"
    }
    res = client.post("/api/hindsight/reflect", json=reflect_payload)
    assert res.status_code == 200
    reflect_data = res.json()
    print(f"   ✓ Agentic reflection completed! Summary preview:\n     {reflect_data.get('reflection', '')[:120]}...")

    # 9. AI Business Assistant Chat with Memory Provenance
    print("\n9. Testing /api/ai/chat (Hindsight Grounded Advice)...")
    chat_payload = {
        "message": "Can I extend Rs 1,500 credit to Ramesh Kumar today?",
        "history": []
    }
    res = client.post("/api/ai/chat", json=chat_payload)
    assert res.status_code == 200
    chat_data = res.json()
    print(f"   ✓ AI Assistant replied!")
    print(f"     Memories Injected: {len(chat_data['recalled_memories'])}")
    print(f"     Suggested Actions: {', '.join(chat_data.get('actions_suggested', []))}")

    print("\n==================================================")
    print("  ALL 9 END-TO-END VERIFICATION TESTS PASSED!     ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
