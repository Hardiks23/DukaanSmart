from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models import Product, Sale, SaleItem, Customer, CreditLedger

class AnalyticsService:
    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Today's metrics
        today_sales = db.query(Sale).filter(Sale.created_at >= today_start).all()
        today_revenue = sum(s.total_amount for s in today_sales)
        today_profit = sum(s.gross_profit for s in today_sales)
        today_count = len(today_sales)

        # 2. All-time sales metrics
        all_sales = db.query(Sale).all()
        total_revenue = sum(s.total_amount for s in all_sales)
        total_profit = sum(s.gross_profit for s in all_sales)
        total_count = len(all_sales)

        # 3. Inventory valuation & alerts
        products = db.query(Product).filter(Product.is_active == True).all()
        total_inv_cost = sum(p.quantity * p.purchase_cost for p in products)
        total_inv_retail = sum(p.quantity * p.selling_price for p in products)
        
        low_stock_products = [p for p in products if p.quantity <= p.min_threshold]
        
        # Products expiring in next 45 days
        today_date_str = datetime.utcnow().strftime("%Y-%m-%d")
        expiring_threshold_str = (datetime.utcnow() + timedelta(days=45)).strftime("%Y-%m-%d")
        expiring_products = [
            p for p in products
            if p.expiry_date and today_date_str <= p.expiry_date <= expiring_threshold_str
        ]

        # 4. Customer credit (Udhar)
        customers = db.query(Customer).all()
        total_outstanding_credit = sum(c.current_balance for c in customers)

        return {
            "today_revenue": round(today_revenue, 2),
            "today_sales_count": today_count,
            "today_profit": round(today_profit, 2),
            "total_revenue_all_time": round(total_revenue, 2),
            "total_sales_count_all_time": total_count,
            "estimated_gross_profit_all_time": round(total_profit, 2),
            "total_inventory_cost_value": round(total_inv_cost, 2),
            "total_inventory_retail_value": round(total_inv_retail, 2),
            "low_stock_count": len(low_stock_products),
            "expiring_soon_count": len(expiring_products),
            "outstanding_credit": round(total_outstanding_credit, 2),
            "total_customers": len(customers),
            "total_products": len(products),
        }

    @staticmethod
    def get_sales_trends(db: Session, days: int = 14) -> List[Dict[str, Any]]:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        sales = db.query(Sale).filter(Sale.created_at >= start_date).order_by(Sale.created_at.asc()).all()

        # Group by date YYYY-MM-DD
        daily_map = {}
        for d in range(days + 1):
            day_str = (start_date + timedelta(days=d)).strftime("%Y-%m-%d")
            daily_map[day_str] = {
                "date": day_str,
                "label": (start_date + timedelta(days=d)).strftime("%d %b"),
                "revenue": 0.0,
                "profit": 0.0,
                "transactions": 0,
                "upi_revenue": 0.0,
                "cash_revenue": 0.0,
                "credit_revenue": 0.0
            }

        for s in sales:
            day_key = s.created_at.strftime("%Y-%m-%d")
            if day_key in daily_map:
                daily_map[day_key]["revenue"] += s.total_amount
                daily_map[day_key]["profit"] += s.gross_profit
                daily_map[day_key]["transactions"] += 1
                if s.payment_method == "UPI":
                    daily_map[day_key]["upi_revenue"] += s.total_amount
                elif s.payment_method == "CASH":
                    daily_map[day_key]["cash_revenue"] += s.total_amount
                elif s.payment_method == "CREDIT":
                    daily_map[day_key]["credit_revenue"] += s.total_amount

        result = list(daily_map.values())
        for r in result:
            r["revenue"] = round(r["revenue"], 2)
            r["profit"] = round(r["profit"], 2)
            r["upi_revenue"] = round(r["upi_revenue"], 2)
            r["cash_revenue"] = round(r["cash_revenue"], 2)
            r["credit_revenue"] = round(r["credit_revenue"], 2)

        return result

    @staticmethod
    def get_top_products(db: Session, limit: int = 6) -> Dict[str, Any]:
        # Top selling by units sold
        top_by_volume = (
            db.query(
                SaleItem.product_name,
                func.sum(SaleItem.quantity).label("units_sold"),
                func.sum(SaleItem.total_amount).label("total_revenue"),
                func.sum(SaleItem.total_profit).label("total_profit")
            )
            .group_by(SaleItem.product_name)
            .order_by(desc("units_sold"))
            .limit(limit)
            .all()
        )

        # Top by profit
        top_by_profit = (
            db.query(
                SaleItem.product_name,
                func.sum(SaleItem.quantity).label("units_sold"),
                func.sum(SaleItem.total_amount).label("total_revenue"),
                func.sum(SaleItem.total_profit).label("total_profit")
            )
            .group_by(SaleItem.product_name)
            .order_by(desc("total_profit"))
            .limit(limit)
            .all()
        )

        return {
            "by_volume": [
                {
                    "name": r[0],
                    "units": int(r[1] or 0),
                    "revenue": round(float(r[2] or 0), 2),
                    "profit": round(float(r[3] or 0), 2)
                }
                for r in top_by_volume
            ],
            "by_profit": [
                {
                    "name": r[0],
                    "units": int(r[1] or 0),
                    "revenue": round(float(r[2] or 0), 2),
                    "profit": round(float(r[3] or 0), 2)
                }
                for r in top_by_profit
            ]
        }

    @staticmethod
    def get_category_breakdown(db: Session) -> List[Dict[str, Any]]:
        categories = (
            db.query(
                Product.category,
                func.count(Product.id).label("product_count"),
                func.sum(Product.quantity * Product.purchase_cost).label("inventory_cost")
            )
            .filter(Product.is_active == True)
            .group_by(Product.category)
            .all()
        )

        return [
            {
                "category": r[0],
                "product_count": r[1],
                "inventory_value": round(float(r[2] or 0), 2)
            }
            for r in categories
        ]

    @staticmethod
    def get_payment_method_breakdown(db: Session) -> Dict[str, Any]:
        sales = db.query(Sale.payment_method, func.sum(Sale.total_amount), func.count(Sale.id)).group_by(Sale.payment_method).all()
        result = {"CASH": 0.0, "UPI": 0.0, "CREDIT": 0.0, "total": 0.0}
        counts = {"CASH": 0, "UPI": 0, "CREDIT": 0}
        for method, total, count in sales:
            result[method] = round(float(total or 0), 2)
            counts[method] = count
            result["total"] += float(total or 0)
        result["counts"] = counts
        return result

analytics_service = AnalyticsService()
