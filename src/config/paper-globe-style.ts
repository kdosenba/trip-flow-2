import type { StyleSpecification } from "maplibre-gl";

export const initialPaperGlobeStyle = {
  version: 8,
  name: "Paper Craft Globe",
  metadata: {
    "map:author": "Craft Developer",
    "map:description":
      "Strictly validated JSON with clean roads and complete labels with 3D elevation terrain.",
  },
  center: [-73.97, 40.71],
  zoom: 14,
  projection: {
    type: "globe",
  },
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
    "terrain-source": {
      type: "raster-dem",
      url: "https://tiles.mapterhorn.com/tilejson.json",
      encoding: "terrarium",
    },
  },
  terrain: {
    source: "terrain-source",
    exaggeration: 1,
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#F2EBE3",
      },
    },
    {
      id: "landcover_wood",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["in", "class", "wood", "grass"],
      paint: {
        "fill-color": "#BFC4B5",
        "fill-opacity": 0.6,
      },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": "#AAB2B5",
      },
    },
    {
      id: "snow-layer",
      type: "color-relief",
      source: "terrain-source",
      paint: {
        "color-relief-color": [
          "interpolate",
          ["linear"],
          ["elevation"],
          1800,
          "rgba(255, 255, 255, 0)",
          2300,
          "rgba(255, 255, 255, 0.95)",
        ],
        "color-relief-opacity": 0.85,
      },
    },
    {
      id: "hills",
      type: "hillshade",
      source: "terrain-source",
      layout: {
        visibility: "visible",
      },
      paint: {
        "hillshade-shadow-color": "#4A3B24",
        "hillshade-highlight-color": "#FFFFFF",
        "hillshade-exaggeration": 0.6,
      },
    },
    {
      id: "admin_country",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["all", ["==", "admin_level", 2], ["!=", "maritime", 1]],
      paint: {
        "line-color": "#4A433A",
        "line-width": 2,
        "line-dasharray": [1, 2],
      },
    },
    {
      id: "admin_state",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      minzoom: 3,
      filter: ["all", ["==", "admin_level", 4], ["!=", "maritime", 1]],
      paint: {
        "line-color": "#9D958A",
        "line-width": 1.5,
        "line-dasharray": [2, 3],
      },
    },
    {
      id: "road_primary_tunnel_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["==", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#B5AC9F",
        "line-dasharray": [1, 1],
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 4],
            [16, 10],
            [20, 20],
          ],
        },
      },
    },
    {
      id: "road_motorway_tunnel_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: ["all", ["==", "class", "motorway"], ["==", "brunnel", "tunnel"]],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#8C8377",
        "line-dasharray": [1, 1],
        "line-width": {
          base: 1.2,
          stops: [
            [5, 1],
            [12, 5],
            [16, 14],
            [20, 28],
          ],
        },
      },
    },
    {
      id: "road_primary_tunnel_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["==", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#DFD7CB",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.2],
            [12, 2.5],
            [16, 7],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "road_motorway_tunnel_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: ["all", ["==", "class", "motorway"], ["==", "brunnel", "tunnel"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#C9C1B5",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 3],
            [16, 10],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "road_secondary_ground_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: [
        "all",
        ["==", "class", "secondary"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#B5AC9F",
        "line-width": {
          base: 1.2,
          stops: [
            [9, 0.5],
            [12, 3],
            [16, 8],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "road_primary_ground_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#8A8074",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 4],
            [16, 10],
            [20, 20],
          ],
        },
      },
    },
    {
      id: "road_motorway_ground_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["==", "class", "motorway"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#5C544A",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 1],
            [12, 5],
            [16, 14],
            [20, 28],
          ],
        },
      },
    },
    {
      id: "road_minor_ground_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 13,
      filter: [
        "all",
        ["in", "class", "minor", "tertiary", "residential"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#C7BEB1",
        "line-width": {
          base: 1.2,
          stops: [
            [13, 0.5],
            [16, 3],
            [20, 8],
          ],
        },
      },
    },
    {
      id: "road_secondary_ground_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: [
        "all",
        ["==", "class", "secondary"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#D6CFC4",
        "line-width": {
          base: 1.2,
          stops: [
            [9, 0.2],
            [12, 1.5],
            [16, 5],
            [20, 12],
          ],
        },
      },
    },
    {
      id: "road_primary_ground_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#A8A095",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.2],
            [12, 2.5],
            [16, 7],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "road_motorway_ground_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["==", "class", "motorway"],
        ["!=", "brunnel", "bridge"],
        ["!=", "brunnel", "tunnel"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#7A7064",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 3],
            [16, 10],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "road_secondary_bridge_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: [
        "all",
        ["==", "class", "secondary"],
        ["==", "brunnel", "bridge"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#B5AC9F",
        "line-width": {
          base: 1.2,
          stops: [
            [9, 0.5],
            [12, 3],
            [16, 8],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "road_primary_bridge_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["==", "brunnel", "bridge"],
      ],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#8A8074",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 4],
            [16, 10],
            [20, 20],
          ],
        },
      },
    },
    {
      id: "road_motorway_bridge_base",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: ["all", ["==", "class", "motorway"], ["==", "brunnel", "bridge"]],
      layout: {
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#5C544A",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 1],
            [12, 5],
            [16, 14],
            [20, 28],
          ],
        },
      },
    },
    {
      id: "road_minor_bridge_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 13,
      filter: [
        "all",
        ["in", "class", "minor", "tertiary", "residential"],
        ["==", "brunnel", "bridge"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#C7BEB1",
        "line-width": {
          base: 1.2,
          stops: [
            [13, 0.5],
            [16, 3],
            [20, 8],
          ],
        },
      },
    },
    {
      id: "road_secondary_bridge_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: [
        "all",
        ["==", "class", "secondary"],
        ["==", "brunnel", "bridge"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#D6CFC4",
        "line-width": {
          base: 1.2,
          stops: [
            [9, 0.2],
            [12, 1.5],
            [16, 5],
            [20, 12],
          ],
        },
      },
    },
    {
      id: "road_primary_bridge_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["in", "class", "trunk", "primary"],
        ["==", "brunnel", "bridge"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#A8A095",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.2],
            [12, 2.5],
            [16, 7],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "road_motorway_bridge_top",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: ["all", ["==", "class", "motorway"], ["==", "brunnel", "bridge"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#7A7064",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.5],
            [12, 3],
            [16, 10],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "building_shadow",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      maxzoom: 14.9,
      paint: {
        "fill-color": "#A69F93",
        "fill-translate": [2, 2],
      },
    },
    {
      id: "building_2d",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      maxzoom: 14.9,
      paint: {
        "fill-color": "#E3DAC9",
      },
    },
    {
      id: "building_3d",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#E3DAC9",
        "fill-extrusion-height": ["get", "render_height"],
        "fill-extrusion-base": ["get", "render_min_height"],
        "fill-extrusion-opacity": 0.95,
      },
    },
    {
      id: "label_country",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 1,
      maxzoom: 5,
      filter: ["==", "class", "country"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": {
          stops: [
            [2, 11],
            [5, 17],
          ],
        },
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#4A433A",
        "text-halo-color": "#F2EBE3",
        "text-halo-width": 1.5,
      },
    },
    {
      id: "label_city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 4,
      maxzoom: 14,
      filter: ["==", "class", "city"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": {
          stops: [
            [5, 12],
            [10, 18],
          ],
        },
      },
      paint: {
        "text-color": "#5A5248",
        "text-halo-color": "#F2EBE3",
        "text-halo-width": 1.5,
      },
    },
    {
      id: "label_town",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 9,
      maxzoom: 15,
      filter: ["in", "class", "town", "village", "suburb"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": {
          stops: [
            [9, 10],
            [14, 14],
          ],
        },
      },
      paint: {
        "text-color": "#7A6F62",
        "text-halo-color": "#F2EBE3",
        "text-halo-width": 1.5,
      },
    },
  ],
} as unknown as StyleSpecification;
