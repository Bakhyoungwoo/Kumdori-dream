from langgraph.graph import END, START, StateGraph

from app.graph.nodes import (
    analyze_vision,
    build_spec,
    cv_pipeline,
    generative_pipeline,
    persist_result,
    preprocess_images,
    route_pipeline,
    validate_input,
    validate_result,
    validate_spec,
    video_pipeline,
)
from app.graph.state import ComposeState


def build_graph():
    graph = StateGraph(ComposeState)
    for name, node in {
        "validate_input": validate_input,
        "preprocess_images": preprocess_images,
        "analyze_vision": analyze_vision,
        "build_spec": build_spec,
        "validate_spec": validate_spec,
        "cv_pipeline": cv_pipeline,
        "generative_pipeline": generative_pipeline,
        "video_pipeline": video_pipeline,
        "validate_result": validate_result,
        "persist_result": persist_result,
    }.items():
        graph.add_node(name, node)

    graph.add_edge(START, "validate_input")
    graph.add_edge("validate_input", "preprocess_images")
    graph.add_edge("preprocess_images", "analyze_vision")
    graph.add_edge("analyze_vision", "build_spec")
    graph.add_edge("build_spec", "validate_spec")
    graph.add_conditional_edges(
        "validate_spec",
        route_pipeline,
        {
            "cv_pipeline": "cv_pipeline",
            "generative_pipeline": "generative_pipeline",
            "video_pipeline": "video_pipeline",
        },
    )
    for pipeline in ("cv_pipeline", "generative_pipeline", "video_pipeline"):
        graph.add_edge(pipeline, "validate_result")
    graph.add_edge("validate_result", "persist_result")
    graph.add_edge("persist_result", END)
    return graph.compile()


compose_graph = build_graph()
