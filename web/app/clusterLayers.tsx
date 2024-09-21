import { GeoJSONFeature } from "zod-geojson"
import { Layer, Source } from "react-map-gl"
import { clusterColor } from "./clusterColor"
import React from "react"

export const ClusterLayers = (props: {
    data: GeoJSONFeature, index: number, hoverFeature?: GeoJSONFeature
}) => {
    const hovered = props.data?.properties?.Cluster === props.hoverFeature?.properties?.Cluster
    return (
            <Source type="geojson" data={props.data}>
            <Layer
                type="fill"
                paint={{
                    "fill-color": clusterColor(props.data.properties),
                }}
                id={`cluster-${props.index}`}
            />
            <Layer type="symbol" layout={{
                "text-field": "{Cluster}\n{M}",
                "text-size": 13,
                "text-anchor": "center",
            }}/>
            <Layer
                type="line"
                paint={{
                    "line-color": clusterColor(props.data.properties, hovered ? 180 : 20),
                    "line-width": 2,
                }}
            />
        </Source>
    )
}