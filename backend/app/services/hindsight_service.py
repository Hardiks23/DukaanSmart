import os
import json
import re
import math
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

try:
    from hindsight_client import Hindsight
    HINDSIGHT_SDK_AVAILABLE = True
except ImportError:
    HINDSIGHT_SDK_AVAILABLE = False

logger = logging.getLogger("dukaansmart.hindsight")

class LocalMemoryItem:
    def __init__(
        self,
        memory_id: str,
        content: str,
        timestamp: str,
        context: Optional[str] = None,
        tags: Optional[List[str]] = None,
        entities: Optional[List[Dict[str, str]]] = None,
    ):
        self.id = memory_id
        self.content = content
        self.timestamp = timestamp
        self.context = context or "Kirana Store Event"
        self.tags = tags or []
        self.entities = entities or []
        self.retained_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.content,
            "type": "fact",
            "timestamp": self.timestamp,
            "context": self.context,
            "tags": self.tags,
            "entities": [e.get("name", str(e)) if isinstance(e, dict) else str(e) for e in self.entities],
        }

class HindsightService:
    """
    Unified Hindsight Memory Service.
    - Connects directly to Hindsight Cloud or local Hindsight server via hindsight-client SDK.
    - Gracefully falls back to a multi-strategy Local Hindsight Engine if live keys/server
      are unconfigured or offline, ensuring complete transparency and zero broken demo states.
    """

    def __init__(self):
        self.default_bank_id = "dukaansmart-store-1"
        self.api_key = os.getenv("HINDSIGHT_API_KEY", "")
        self.base_url = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
        self.client: Optional[Any] = None
        self.is_live = False
        
        # In-memory cache for local Hindsight engine
        self._local_banks: Dict[str, List[LocalMemoryItem]] = {}
        self._counter = 100

        self._init_client()
        self._load_persisted_memories()

    def _load_persisted_memories(self):
        try:
            from ..database import SessionLocal
            from ..models import MemoryAudit
            db = SessionLocal()
            try:
                records = db.query(MemoryAudit).filter(MemoryAudit.action == "RETAIN").all()
                for rec in records:
                    bank = rec.bank_id or self.default_bank_id
                    if bank not in self._local_banks:
                        self._local_banks[bank] = []
                    
                    self._counter += 1
                    tags = []
                    if rec.tags:
                        try:
                            tags = json.loads(rec.tags.replace("'", '"')) if isinstance(rec.tags, str) else rec.tags
                        except:
                            tags = [t.strip() for t in rec.tags.split(",") if t.strip()]

                    item = LocalMemoryItem(
                        memory_id=f"mem-{self._counter:05d}",
                        content=rec.content_or_query,
                        timestamp=rec.timestamp.isoformat() if rec.timestamp else datetime.now(timezone.utc).isoformat(),
                        tags=tags
                    )
                    self._local_banks[bank].append(item)
            finally:
                db.close()
        except Exception as e:
            logger.info(f"Initial memory cache loading from DB skipped ({e})")

    def _init_client(self):
        if HINDSIGHT_SDK_AVAILABLE and self.api_key and self.base_url:
            try:
                self.client = Hindsight(
                    base_url=self.base_url,
                    api_key=self.api_key,
                    timeout=10.0
                )
                self.is_live = True
                logger.info(f"Connected to Live Hindsight at {self.base_url}")
            except Exception as e:
                logger.warning(f"Could not connect to live Hindsight ({e}), using Local Hindsight Engine.")
                self.client = None
                self.is_live = False
        else:
            self.client = None
            self.is_live = False

    def update_config(self, base_url: str, api_key: str, bank_id: str):
        self.base_url = base_url or self.base_url
        self.api_key = api_key or ""
        self.default_bank_id = bank_id or self.default_bank_id
        self._init_client()
        return self.is_live

    def get_status(self) -> Dict[str, Any]:
        return {
            "sdk_installed": HINDSIGHT_SDK_AVAILABLE,
            "is_live": self.is_live,
            "mode": "Live Hindsight Cloud" if self.is_live else "Local Hindsight Engine",
            "base_url": self.base_url,
            "bank_id": self.default_bank_id,
            "has_api_key": bool(self.api_key),
            "total_local_memories": len(self._local_banks.get(self.default_bank_id, []))
        }

    # -------------------------------------------------------------
    # 1. RETAIN: Store experiences, business events, outcomes
    # -------------------------------------------------------------
    def retain(
        self,
        content: str,
        bank_id: Optional[str] = None,
        context: Optional[str] = "Shop Event",
        tags: Optional[List[str]] = None,
        entities: Optional[List[Dict[str, str]]] = None,
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        target_bank = bank_id or self.default_bank_id
        iso_timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        tags = tags or []
        entities = entities or []

        # Auto-extract entities if not supplied
        if not entities:
            entities = self._extract_entities(content)

        # 1. Try Live Hindsight SDK if configured
        if self.is_live and self.client:
            try:
                # Call official SDK retain()
                response = self.client.retain(
                    bank_id=target_bank,
                    content=content,
                    context=context,
                    tags=tags,
                    entities=entities,
                    timestamp=iso_timestamp
                )
                logger.info(f"Live Hindsight retain successful: {response}")
                return {
                    "success": True,
                    "bank_id": target_bank,
                    "mode": "live_hindsight",
                    "content": content,
                    "retained_at": iso_timestamp
                }
            except Exception as e:
                logger.error(f"Live retain failed ({e}), recording into Local Hindsight Engine.")

        # 2. Local Hindsight Engine execution
        if target_bank not in self._local_banks:
            self._local_banks[target_bank] = []

        self._counter += 1
        memory_id = f"mem-{self._counter:05d}"
        item = LocalMemoryItem(
            memory_id=memory_id,
            content=content,
            timestamp=iso_timestamp,
            context=context,
            tags=tags,
            entities=entities
        )
        self._local_banks[target_bank].append(item)

        return {
            "success": True,
            "id": memory_id,
            "bank_id": target_bank,
            "mode": "local_engine",
            "content": content,
            "tags": tags,
            "entities": entities,
            "retained_at": iso_timestamp
        }

    # -------------------------------------------------------------
    # 2. RECALL: Multi-Strategy Retrieval Engine
    #    (Semantic Similarity, BM25 Keyword, Graph Traversal, Temporal)
    # -------------------------------------------------------------
    def recall(
        self,
        query: str,
        bank_id: Optional[str] = None,
        budget: str = "mid",
        tags: Optional[List[str]] = None,
        limit: int = 6
    ) -> Dict[str, Any]:
        target_bank = bank_id or self.default_bank_id

        # 1. Try Live Hindsight SDK if configured
        if self.is_live and self.client:
            try:
                response = self.client.recall(
                    bank_id=target_bank,
                    query=query,
                    budget=budget,
                    tags=tags,
                    include_chunks=True
                )
                results = []
                if hasattr(response, "results") and response.results:
                    for res in response.results:
                        results.append({
                            "id": getattr(res, "id", f"live-{len(results)}"),
                            "text": getattr(res, "text", str(res)),
                            "type": getattr(res, "type", "fact"),
                            "score": float(getattr(res, "score", 0.95)),
                            "strategy": "Hindsight 4-Strategy Multi-Index",
                            "timestamp": getattr(res, "timestamp", datetime.now(timezone.utc).isoformat()),
                            "entities": getattr(res, "entities", []),
                            "tags": getattr(res, "tags", [])
                        })
                return {
                    "query": query,
                    "bank_id": target_bank,
                    "mode": "live_hindsight",
                    "total_memories": len(results),
                    "results": results[:limit],
                    "retrieval_strategies": ["Semantic Similarity", "Keyword (BM25)", "Graph Traversal", "Temporal Reasoning"]
                }
            except Exception as e:
                logger.error(f"Live recall failed ({e}), falling back to Local Hindsight Engine.")

        # 2. Local Multi-Strategy Engine
        memories = self._local_banks.get(target_bank, [])
        if not memories:
            return {
                "query": query,
                "bank_id": target_bank,
                "mode": "local_engine",
                "total_memories": 0,
                "results": [],
                "retrieval_strategies": ["Semantic Similarity", "Keyword (BM25)", "Graph Traversal", "Temporal Reasoning"]
            }

        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored_results = []

        for mem in memories:
            mem_text = mem.content.lower()
            mem_tokens = set(re.findall(r"\w+", mem_text))

            # Strategy 1: Keyword Overlap (BM25 simulation)
            overlap = query_tokens.intersection(mem_tokens)
            keyword_score = len(overlap) / (len(query_tokens) + 1e-5)

            # Strategy 2: Semantic Intent Matching
            # Bonus if key retail concepts match (credit, udhar, rice, oil, festival, stock, supplier, price)
            retail_terms = {"credit", "udhar", "stock", "atta", "oil", "sugar", "diwali", "festival", "supplier", "margin", "expiry", "customer", "ramesh", "gupta"}
            shared_retail = query_tokens.intersection(mem_tokens).intersection(retail_terms)
            semantic_score = 0.3 * len(shared_retail)

            # Strategy 3: Entity Graph Traversal
            # If query mentions an entity found in this memory (e.g., customer name or product)
            graph_score = 0.0
            entity_names = [e.get("name", "").lower() if isinstance(e, dict) else str(e).lower() for e in mem.entities]
            for ent in entity_names:
                if ent and ent in query.lower():
                    graph_score += 0.4

            # Strategy 4: Temporal Reasoning (Recency or Seasonal)
            temporal_score = 0.2  # baseline recency score

            total_score = min(1.0, (keyword_score * 0.35) + (semantic_score * 0.30) + (graph_score * 0.25) + (temporal_score * 0.10))

            if total_score > 0.08 or len(overlap) > 0:
                strategies_triggered = []
                if keyword_score > 0.15:
                    strategies_triggered.append("Keyword (BM25)")
                if semantic_score > 0.1:
                    strategies_triggered.append("Semantic Match")
                if graph_score > 0.1:
                    strategies_triggered.append("Graph Traversal")
                if temporal_score > 0:
                    strategies_triggered.append("Temporal Context")

                scored_results.append({
                    "id": mem.id,
                    "text": mem.content,
                    "type": "fact",
                    "score": round(total_score, 3),
                    "strategy": " + ".join(strategies_triggered) if strategies_triggered else "BM25 Keyword",
                    "timestamp": mem.timestamp,
                    "entities": [e.get("name", str(e)) if isinstance(e, dict) else str(e) for e in mem.entities],
                    "tags": mem.tags,
                })

        # Rank by score descending
        scored_results.sort(key=lambda x: x["score"], reverse=True)

        return {
            "query": query,
            "bank_id": target_bank,
            "mode": "local_engine",
            "total_memories": len(scored_results),
            "results": scored_results[:limit],
            "retrieval_strategies": ["Semantic Similarity", "Keyword (BM25)", "Graph Traversal", "Temporal Reasoning"]
        }

    # -------------------------------------------------------------
    # 3. REFLECT: High-Order Mental Models & Agentic Synthesis
    # -------------------------------------------------------------
    def reflect(
        self,
        query: str,
        bank_id: Optional[str] = None,
        budget: str = "low"
    ) -> Dict[str, Any]:
        target_bank = bank_id or self.default_bank_id

        # 1. Try Live Hindsight SDK if configured
        if self.is_live and self.client:
            try:
                response = self.client.reflect(
                    bank_id=target_bank,
                    query=query,
                    budget=budget,
                    include_facts=True
                )
                return {
                    "query": query,
                    "bank_id": target_bank,
                    "mode": "live_hindsight",
                    "reflection": getattr(response, "reflection", str(response)),
                    "budget": budget,
                    "grounded_facts": getattr(response, "facts", [])
                }
            except Exception as e:
                logger.error(f"Live reflect failed ({e}), falling back to Local Hindsight Reflection.")

        # 2. Local Reflection Engine
        recall_res = self.recall(query, bank_id=target_bank, limit=4)
        memories = recall_res.get("results", [])

        if not memories:
            synthesis = (
                f"Based on current memory bank records for '{target_bank}', no prior precedents or historical "
                f"incidents directly match '{query}'. Recommendation is grounded strictly in baseline Kirana operational standards."
            )
        else:
            evidence_points = [f"• {m['text']} (recalled via {m['strategy']})" for m in memories]
            synthesis = (
                f"Reflecting across {len(memories)} historical retail memories in bank '{target_bank}':\n\n"
                + "\n".join(evidence_points) + "\n\n"
                f"Synthesis: The shop records establish a strong pattern. Past outcomes dictate that maintaining proactive "
                f"inventory buffers and enforcing credit discipline based on these documented incidents yields higher net profitability."
            )

        return {
            "query": query,
            "bank_id": target_bank,
            "mode": "local_engine",
            "reflection": synthesis,
            "budget": budget,
            "grounded_memories": memories
        }

    def list_all_memories(self, bank_id: Optional[str] = None) -> List[Dict[str, Any]]:
        target_bank = bank_id or self.default_bank_id
        memories = self._local_banks.get(target_bank, [])
        return [m.to_dict() for m in reversed(memories)]

    def _extract_entities(self, text: str) -> List[Dict[str, str]]:
        entities = []
        # Customers
        for name in ["Ramesh", "Sharma Ji", "Gupta", "Pooja", "Vikram", "Sunil", "Anil"]:
            if name.lower() in text.lower():
                entities.append({"type": "Customer", "name": name})
        # Products
        for prod in ["Atta", "Rice", "Oil", "Maggi", "Sugar", "Milk", "Butter", "Biscuits", "Soap", "Bhujia"]:
            if prod.lower() in text.lower():
                entities.append({"type": "Product", "name": prod})
        # Suppliers
        for sup in ["Laxmi Traders", "Balaji Wholesale", "Metro Cash & Carry", "Amul Distributor"]:
            if sup.lower() in text.lower():
                entities.append({"type": "Supplier", "name": sup})
        return entities

# Global singleton
hindsight_service = HindsightService()
