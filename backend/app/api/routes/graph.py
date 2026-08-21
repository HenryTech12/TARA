from fastapi import APIRouter

from app.services.graph_service import get_full_graph, get_graph_edges

router = APIRouter()


@router.get("/graph")
def get_graph() -> dict:
    """Returns the full identity graph — nodes are verified identities,
    links are derived shared-attribute edges (device, address, employer).
    """
    graph = get_full_graph()
    nodes = [
        {
            "id": node["id"],
            "label": node["name"],
            "device_id": node["device_id"],
            "address": node["address"],
            "employer": node["employer"],
        }
        for node in graph.values()
    ]
    links = [
        {
            "source": edge["source"],
            "target": edge["target"],
            "attribute_type": edge["attribute_type"],
            "attribute_value": edge["attribute_value"],
        }
        for edge in get_graph_edges()
    ]
    return {"nodes": nodes, "links": links}
