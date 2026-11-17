// CDN addresses are configured at the top of dist/cdn-config.js.
import { FLAMO_CDN_URLS as __flamoCdn } from "./cdn-config.js";
const { "createFlamoRuntime": createFlamoRuntime, "createFlamoResourcePool": createFlamoResourcePool, "createInteractionTargetController": createInteractionTargetController, "materializeCurrentArtifactComponent": materializeCurrentArtifactComponent, "prepareFigmaSceneNodes": prepareFigmaSceneNodes, "registerProxyBinding": registerProxyBinding, "unregisterProxyBinding": unregisterProxyBinding, "batchUnregisterProxyBindings": batchUnregisterProxyBindings, "dispatchEntityEvent": dispatchEntityEvent, "updateEntityReactiveState": updateEntityReactiveState, "createEntityHandle": createEntityHandle, "computed": computed, "reactive": reactive, "ref": ref, "watch": watch, "getGlobalEventBridge": getGlobalEventBridge, "FlamoConfig": FlamoConfig } = await import(__flamoCdn["runtime"]);
import * as interactions from "./interactions/index.js";
const { "attachComponentViewport": attachComponentViewport } = await import(__flamoCdn["viewport"]);
import { loadPackagedArtifact } from './component-resources.js';

export const flamoComponentManifest = {
  "schemaVersion": 1,
  "kind": "flamo.web-component",
  "viewport": {
    "pan": false,
    "zoom": false,
    "fit": "contain",
    "transparentBackground": true
  },
  "projectId": "db733b85-ac2c-47ff-9002-c87e18304dfe",
  "tagName": "flamo-coal-system",
  "className": "FlamoCoalSystemElement",
  "packageName": "@flamo-components/flamo-coal-system",
  "name": "输煤组件",
  "generatedAt": "2026-11-17T08:53:28.897Z",
  "source": {
    "kind": "local-fig",
    "id": "2a524432-9bb3-4c96-a7a0-11cc500fc346",
    "name": "输煤"
  },
  "entry": "dist/flamo-coal-system.js",
  "types": "dist/flamo-coal-system.d.ts",
  "surface": {
    "componentPropertiesVersion": "1.0",
    "parameters": {
      "uiBindIds": {
        "type": "array",
        "schema": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1
                  },
                  "notes": {
                    "type": "string"
                  },
                  "value": {
                    "anyOf": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "null"
                      },
                      {
                        "type": "object",
                        "properties": {
                          "left": {
                            "type": [
                              "boolean",
                              "null"
                            ]
                          },
                          "right": {
                            "type": [
                              "boolean",
                              "null"
                            ]
                          }
                        },
                        "required": [
                          "left",
                          "right"
                        ],
                        "additionalProperties": false
                      }
                    ]
                  }
                },
                "required": [
                  "id",
                  "value"
                ],
                "additionalProperties": true
              }
            },
            {
              "type": "object",
              "additionalProperties": {
                "anyOf": [
                  {
                    "type": "number"
                  },
                  {
                    "type": "boolean"
                  },
                  {
                    "type": "null"
                  },
                  {
                    "type": "object",
                    "properties": {
                      "left": {
                        "type": [
                          "boolean",
                          "null"
                        ]
                      },
                      "right": {
                        "type": [
                          "boolean",
                          "null"
                        ]
                      }
                    },
                    "required": [
                      "left",
                      "right"
                    ],
                    "additionalProperties": false
                  }
                ]
              }
            }
          ]
        },
        "default": [],
        "attribute": false,
        "description": "Primary: [{id, notes?, value}], default []; legacy config-ID Record accepted. Complete snapshot replacement; missing IDs clear to unknown. notes is metadata only; last duplicate ID wins. Host-owned data only."
      }
    },
    "events": {
      "coalStateChange": {
        "payload": {
          "devices": "unknown",
          "epoch": "unknown",
          "robot": "unknown",
          "values": "unknown"
        },
        "source": "script",
        "generatedBy": "node-script-public-surface@1",
        "scriptId": "coal-system",
        "scriptSrc": "src/components/coal/script.ts"
      }
    },
    "imperative": {
      "applyPointValues": {
        "args": {
          "valuesInput": "unknown"
        },
        "returns": "void",
        "source": "script",
        "generatedBy": "node-script-public-surface@1",
        "scriptId": "coal-system",
        "scriptSrc": "src/components/coal/script.ts"
      },
      "getCoalState": {
        "args": {},
        "returns": "unknown",
        "source": "script",
        "generatedBy": "node-script-public-surface@1",
        "scriptId": "coal-system",
        "scriptSrc": "src/components/coal/script.ts"
      }
    },
    "slots": {
      "robot__166_0": {
        "name": "robot",
        "description": "<p>机器人占位</p>",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "166:732",
        "outlets": [
          {
            "outletId": "robot:166%3A732",
            "target": "166:732"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "166:0",
          "name": "robot",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "description": "<p>机器人占位</p>",
          "bindingProjection": "metadata"
        }
      },
      "alarm3A__166_1": {
        "name": "Alarm3A__166_1",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "166:735",
        "outlets": [
          {
            "outletId": "alarm3A__166_1:166%3A735",
            "target": "166:735"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "166:1",
          "name": "Alarm3A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm3A__169_0": {
        "name": "Alarm3A__169_0",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "169:979",
        "outlets": [
          {
            "outletId": "alarm3A:169%3A979",
            "target": "169:979"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "169:0",
          "name": "Alarm3A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "metadata"
        }
      },
      "alarm1A__176_0": {
        "name": "Alarm1A__176_0",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:326",
        "outlets": [
          {
            "outletId": "alarm1A:176%3A326",
            "target": "176:326"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:0",
          "name": "Alarm1A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "metadata"
        }
      },
      "alarm2A": {
        "name": "Alarm2A",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:329",
        "outlets": [
          {
            "outletId": "alarm2A:176%3A329",
            "target": "176:329"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:1",
          "name": "Alarm2A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm2B": {
        "name": "Alarm2B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:332",
        "outlets": [
          {
            "outletId": "alarm2B:176%3A332",
            "target": "176:332"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:2",
          "name": "Alarm2B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm3B": {
        "name": "Alarm3B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:335",
        "outlets": [
          {
            "outletId": "alarm3B:176%3A335",
            "target": "176:335"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:3",
          "name": "Alarm3B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm4A": {
        "name": "Alarm4A",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:339",
        "outlets": [
          {
            "outletId": "alarm4A:176%3A339",
            "target": "176:339"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:4",
          "name": "Alarm4A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm6A": {
        "name": "Alarm6A",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:342",
        "outlets": [
          {
            "outletId": "alarm6A:176%3A342",
            "target": "176:342"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:5",
          "name": "Alarm6A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm6C": {
        "name": "Alarm6C",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:345",
        "outlets": [
          {
            "outletId": "alarm6C:176%3A345",
            "target": "176:345"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:6",
          "name": "Alarm6C",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm6D": {
        "name": "Alarm6D",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:348",
        "outlets": [
          {
            "outletId": "alarm6D:176%3A348",
            "target": "176:348"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:7",
          "name": "Alarm6D",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm6B": {
        "name": "Alarm6B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:351",
        "outlets": [
          {
            "outletId": "alarm6B:176%3A351",
            "target": "176:351"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:8",
          "name": "Alarm6B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm5A": {
        "name": "Alarm5A",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:354",
        "outlets": [
          {
            "outletId": "alarm5A:176%3A354",
            "target": "176:354"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:9",
          "name": "Alarm5A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm5B": {
        "name": "Alarm5B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:357",
        "outlets": [
          {
            "outletId": "alarm5B:176%3A357",
            "target": "176:357"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:10",
          "name": "Alarm5B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1A皮带电机电流": {
        "name": "1A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:361",
        "outlets": [
          {
            "outletId": "1A皮带电机电流:176%3A361",
            "target": "176:361"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:12",
          "name": "1A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1B皮带电机电流": {
        "name": "1B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:362",
        "outlets": [
          {
            "outletId": "1B皮带电机电流:176%3A362",
            "target": "176:362"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:13",
          "name": "1B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2A皮带电机电流": {
        "name": "2A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:364",
        "outlets": [
          {
            "outletId": "2A皮带电机电流:176%3A364",
            "target": "176:364"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:14",
          "name": "2A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2B皮带电机电流": {
        "name": "2B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:365",
        "outlets": [
          {
            "outletId": "2B皮带电机电流:176%3A365",
            "target": "176:365"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:15",
          "name": "2B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "3A皮带电机电流": {
        "name": "3A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:366",
        "outlets": [
          {
            "outletId": "3A皮带电机电流:176%3A366",
            "target": "176:366"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:16",
          "name": "3A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "3B皮带电机电流": {
        "name": "3B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:367",
        "outlets": [
          {
            "outletId": "3B皮带电机电流:176%3A367",
            "target": "176:367"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:17",
          "name": "3B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "4A皮带电机电流": {
        "name": "4A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:368",
        "outlets": [
          {
            "outletId": "4A皮带电机电流:176%3A368",
            "target": "176:368"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:18",
          "name": "4A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "4B皮带电机电流": {
        "name": "4B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:369",
        "outlets": [
          {
            "outletId": "4B皮带电机电流:176%3A369",
            "target": "176:369"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:19",
          "name": "4B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "5B皮带电机电流": {
        "name": "5B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:371",
        "outlets": [
          {
            "outletId": "5B皮带电机电流:176%3A371",
            "target": "176:371"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:21",
          "name": "5B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "6A皮带电机电流": {
        "name": "6A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:372",
        "outlets": [
          {
            "outletId": "6A皮带电机电流:176%3A372",
            "target": "176:372"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:22",
          "name": "6A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "6B皮带电机电流": {
        "name": "6B皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:373",
        "outlets": [
          {
            "outletId": "6B皮带电机电流:176%3A373",
            "target": "176:373"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:23",
          "name": "6B皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "6C皮带电机电流": {
        "name": "6C皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:374",
        "outlets": [
          {
            "outletId": "6C皮带电机电流:176%3A374",
            "target": "176:374"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:24",
          "name": "6C皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "6D皮带电机电流": {
        "name": "6D皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "176:375",
        "outlets": [
          {
            "outletId": "6D皮带电机电流:176%3A375",
            "target": "176:375"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "176:25",
          "name": "6D皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1F原煤仓料位": {
        "name": "1F原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:866",
        "outlets": [
          {
            "outletId": "1F原煤仓料位:187%3A866",
            "target": "187:866"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:28",
          "name": "1F原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1E原煤仓料位": {
        "name": "1E原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1534",
        "outlets": [
          {
            "outletId": "1E原煤仓料位:187%3A1534",
            "target": "187:1534"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:29",
          "name": "1E原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1D原煤仓料位": {
        "name": "1D原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1540",
        "outlets": [
          {
            "outletId": "1D原煤仓料位:187%3A1540",
            "target": "187:1540"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:30",
          "name": "1D原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1C原煤仓料位": {
        "name": "1C原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1543",
        "outlets": [
          {
            "outletId": "1C原煤仓料位:187%3A1543",
            "target": "187:1543"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:31",
          "name": "1C原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1B原煤仓料位": {
        "name": "1B原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1546",
        "outlets": [
          {
            "outletId": "1B原煤仓料位:187%3A1546",
            "target": "187:1546"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:32",
          "name": "1B原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "1A原煤仓料位": {
        "name": "1A原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1549",
        "outlets": [
          {
            "outletId": "1A原煤仓料位:187%3A1549",
            "target": "187:1549"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:33",
          "name": "1A原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2F原煤仓料位": {
        "name": "2F原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1552",
        "outlets": [
          {
            "outletId": "2F原煤仓料位:187%3A1552",
            "target": "187:1552"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:34",
          "name": "2F原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2E原煤仓料位": {
        "name": "2E原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1554",
        "outlets": [
          {
            "outletId": "2E原煤仓料位:187%3A1554",
            "target": "187:1554"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:35",
          "name": "2E原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2D原煤仓料位": {
        "name": "2D原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1556",
        "outlets": [
          {
            "outletId": "2D原煤仓料位:187%3A1556",
            "target": "187:1556"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:36",
          "name": "2D原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2C原煤仓料位": {
        "name": "2C原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1558",
        "outlets": [
          {
            "outletId": "2C原煤仓料位:187%3A1558",
            "target": "187:1558"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:37",
          "name": "2C原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2B原煤仓料位": {
        "name": "2B原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1560",
        "outlets": [
          {
            "outletId": "2B原煤仓料位:187%3A1560",
            "target": "187:1560"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:38",
          "name": "2B原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "2A原煤仓料位": {
        "name": "2A原煤仓料位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "187:1562",
        "outlets": [
          {
            "outletId": "2A原煤仓料位:187%3A1562",
            "target": "187:1562"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "187:39",
          "name": "2A原煤仓料位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm4B": {
        "name": "Alarm4B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "193:195",
        "outlets": [
          {
            "outletId": "alarm4B:193%3A195",
            "target": "193:195"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "193:0",
          "name": "Alarm4B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "5A皮带电机电流": {
        "name": "5A皮带电机电流",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "197:313",
        "outlets": [
          {
            "outletId": "5A皮带电机电流:197%3A313",
            "target": "197:313"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "197:5",
          "name": "5A皮带电机电流",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm1A2": {
        "name": "Alarm1A2",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "316:508",
        "outlets": [
          {
            "outletId": "alarm1A2:316%3A508",
            "target": "316:508"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "316:0",
          "name": "Alarm1A2",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "metadata"
        }
      },
      "alarm6C2": {
        "name": "Alarm6C2",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "source": "figma",
        "figma": {
          "id": "325:1",
          "name": "Alarm6C2",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "metadata"
        }
      },
      "alarm1A__325_2": {
        "name": "Alarm1A__325_2",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "325:942",
        "outlets": [
          {
            "outletId": "alarm1A__325_2:325%3A942",
            "target": "325:942"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "325:2",
          "name": "Alarm1A",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "alarm1B": {
        "name": "Alarm1B",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "325:944",
        "outlets": [
          {
            "outletId": "alarm1B:325%3A944",
            "target": "325:944"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "325:3",
          "name": "Alarm1B",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "robot__344_0": {
        "name": "Robot",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "344:1116",
        "outlets": [
          {
            "outletId": "robot__344_0:344%3A1116",
            "target": "344:1116"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "344:0",
          "name": "Robot",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "消防高位水箱水位": {
        "name": "消防高位水箱水位",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "344:1123",
        "outlets": [
          {
            "outletId": "消防高位水箱水位:344%3A1123",
            "target": "344:1123"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "344:1",
          "name": "消防高位水箱水位",
          "type": "SLOT",
          "nodeId": "166:730",
          "projection": "native",
          "bindingProjection": "native"
        }
      }
    }
  },
  "resources": [],
  "scripts": [
    {
      "id": "coal-209-818",
      "src": "src/components/coal/device-209-818.ts",
      "language": "ts",
      "behaviorRef": "project.coal.crusher",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-209-818/register.js"
    },
    {
      "id": "coal-221-951",
      "src": "src/components/coal/device-221-951.ts",
      "language": "ts",
      "behaviorRef": "project.coal.screen",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-221-951/register.js"
    },
    {
      "id": "coal-94-101272",
      "src": "src/components/coal/device-94-101272.ts",
      "language": "ts",
      "behaviorRef": "project.coal.plough",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-94-101272/register.js"
    },
    {
      "id": "coal-94-101209",
      "src": "src/components/coal/device-94-101209.ts",
      "language": "ts",
      "behaviorRef": "project.coal.plough",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-94-101209/register.js"
    },
    {
      "id": "coal-94-101607",
      "src": "src/components/coal/device-94-101607.ts",
      "language": "ts",
      "behaviorRef": "project.coal.motor",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-94-101607/register.js"
    },
    {
      "id": "coal-94-101763",
      "src": "src/components/coal/device-94-101763.ts",
      "language": "ts",
      "behaviorRef": "project.coal.tee",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-94-101763/register.js"
    },
    {
      "id": "coal-209-639",
      "src": "src/components/coal/device-209-639.ts",
      "language": "ts",
      "behaviorRef": "project.coal.feeder",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-209-639/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-system",
      "src": "src/components/coal/script.ts",
      "language": "ts",
      "behaviorRef": "project.coal.system",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-system/register.js"
    },
    {
      "id": "coal-187-1572",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1572/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1577",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1577/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1582",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1582/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1587",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1587/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1592",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1592/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1597",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1597/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1602",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1602/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1607",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1607/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1612",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1612/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1617",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1617/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1622",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1622/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-187-1627",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-1627/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-261-1228",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-261-1228/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-271-1594",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.flow",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-271-1594/register.js"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "managed:hmi.pipe-flow@2.6.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.6.0"
    },
    {
      "id": "coal-91-100532",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100532/register.js"
    },
    {
      "id": "coal-91-100533",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100533/register.js"
    },
    {
      "id": "coal-91-100542",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100542/register.js"
    },
    {
      "id": "coal-91-100543",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100543/register.js"
    },
    {
      "id": "coal-197-310",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-197-310/register.js"
    },
    {
      "id": "coal-197-311",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-197-311/register.js"
    },
    {
      "id": "coal-197-312",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-197-312/register.js"
    },
    {
      "id": "coal-91-100651",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100651/register.js"
    },
    {
      "id": "coal-91-100652",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100652/register.js"
    },
    {
      "id": "coal-91-100512",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100512/register.js"
    },
    {
      "id": "coal-91-100513",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100513/register.js"
    },
    {
      "id": "coal-176-339",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-339/register.js"
    },
    {
      "id": "coal-83-99032",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-83-99032/register.js"
    },
    {
      "id": "coal-83-99033",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-83-99033/register.js"
    },
    {
      "id": "coal-83-99034",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-83-99034/register.js"
    },
    {
      "id": "coal-91-100522",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100522/register.js"
    },
    {
      "id": "coal-91-100523",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100523/register.js"
    },
    {
      "id": "coal-91-100488",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100488/register.js"
    },
    {
      "id": "coal-91-100487",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100487/register.js"
    },
    {
      "id": "coal-91-100502",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100502/register.js"
    },
    {
      "id": "coal-91-100503",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100503/register.js"
    },
    {
      "id": "coal-91-100479",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100479/register.js"
    },
    {
      "id": "coal-91-100478",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100478/register.js"
    },
    {
      "id": "coal-91-100470",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100470/register.js"
    },
    {
      "id": "coal-91-100469",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100469/register.js"
    },
    {
      "id": "coal-91-100461",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100461/register.js"
    },
    {
      "id": "coal-91-100460",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100460/register.js"
    },
    {
      "id": "coal-59-764",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-59-764/register.js"
    },
    {
      "id": "coal-59-763",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-59-763/register.js"
    },
    {
      "id": "coal-176-329",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-329/register.js"
    },
    {
      "id": "coal-176-332",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-332/register.js"
    },
    {
      "id": "coal-176-335",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-335/register.js"
    },
    {
      "id": "coal-166-735",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-166-735/register.js"
    },
    {
      "id": "coal-176-342",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-342/register.js"
    },
    {
      "id": "coal-176-351",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-351/register.js"
    },
    {
      "id": "coal-193-195",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-193-195/register.js"
    },
    {
      "id": "coal-176-354",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-354/register.js"
    },
    {
      "id": "coal-176-357",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-357/register.js"
    },
    {
      "id": "coal-91-100661",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100661/register.js"
    },
    {
      "id": "coal-91-100662",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.wheel",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-91-100662/register.js"
    },
    {
      "id": "coal-176-345",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-345/register.js"
    },
    {
      "id": "coal-176-348",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-348/register.js"
    },
    {
      "id": "coal-325-942",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-325-942/register.js"
    },
    {
      "id": "coal-325-944",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.alarm",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-325-944/register.js"
    },
    {
      "id": "coal-176-372",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-372/register.js"
    },
    {
      "id": "coal-176-373",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-373/register.js"
    },
    {
      "id": "coal-197-313",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-197-313/register.js"
    },
    {
      "id": "coal-176-374",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-374/register.js"
    },
    {
      "id": "coal-176-368",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-368/register.js"
    },
    {
      "id": "coal-176-371",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-371/register.js"
    },
    {
      "id": "coal-176-369",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-369/register.js"
    },
    {
      "id": "coal-176-366",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-366/register.js"
    },
    {
      "id": "coal-176-367",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-367/register.js"
    },
    {
      "id": "coal-176-365",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-365/register.js"
    },
    {
      "id": "coal-176-364",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-364/register.js"
    },
    {
      "id": "coal-176-362",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-362/register.js"
    },
    {
      "id": "coal-176-361",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-361/register.js"
    },
    {
      "id": "coal-176-375",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.number",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-176-375/register.js"
    },
    {
      "id": "coal-86-100003",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100003/register.js"
    },
    {
      "id": "coal-86-100008",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100008/register.js"
    },
    {
      "id": "coal-86-100013",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100013/register.js"
    },
    {
      "id": "coal-86-100018",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100018/register.js"
    },
    {
      "id": "coal-86-100023",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100023/register.js"
    },
    {
      "id": "coal-86-100028",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-86-100028/register.js"
    },
    {
      "id": "coal-187-830",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-830/register.js"
    },
    {
      "id": "coal-187-835",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-835/register.js"
    },
    {
      "id": "coal-187-840",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-840/register.js"
    },
    {
      "id": "coal-187-845",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-845/register.js"
    },
    {
      "id": "coal-187-850",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-850/register.js"
    },
    {
      "id": "coal-187-855",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-187-855/register.js"
    },
    {
      "id": "coal-325-990",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.level",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-325-990/register.js"
    },
    {
      "id": "coal-351-489",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-489/register.js"
    },
    {
      "id": "coal-351-491",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-491/register.js"
    },
    {
      "id": "coal-351-493",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-493/register.js"
    },
    {
      "id": "coal-351-495",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-495/register.js"
    },
    {
      "id": "coal-351-514",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-514/register.js"
    },
    {
      "id": "coal-351-516",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-516/register.js"
    },
    {
      "id": "coal-350-712",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-712/register.js"
    },
    {
      "id": "coal-350-714",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-714/register.js"
    },
    {
      "id": "coal-350-716",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-716/register.js"
    },
    {
      "id": "coal-350-718",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-718/register.js"
    },
    {
      "id": "coal-351-400",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-400/register.js"
    },
    {
      "id": "coal-351-407",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-407/register.js"
    },
    {
      "id": "coal-351-428",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-428/register.js"
    },
    {
      "id": "coal-351-435",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-435/register.js"
    },
    {
      "id": "coal-351-464",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-464/register.js"
    },
    {
      "id": "coal-351-466",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-466/register.js"
    },
    {
      "id": "coal-351-468",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-468/register.js"
    },
    {
      "id": "coal-351-470",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-470/register.js"
    },
    {
      "id": "coal-350-654",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-654/register.js"
    },
    {
      "id": "coal-350-673",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-673/register.js"
    },
    {
      "id": "coal-350-656",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-656/register.js"
    },
    {
      "id": "coal-350-658",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-658/register.js"
    },
    {
      "id": "coal-351-547",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-547/register.js"
    },
    {
      "id": "coal-351-549",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-549/register.js"
    },
    {
      "id": "coal-351-551",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-551/register.js"
    },
    {
      "id": "coal-351-553",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-553/register.js"
    },
    {
      "id": "coal-351-555",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-555/register.js"
    },
    {
      "id": "coal-351-557",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-557/register.js"
    },
    {
      "id": "coal-350-635",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-635/register.js"
    },
    {
      "id": "coal-350-637",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-637/register.js"
    },
    {
      "id": "coal-350-639",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-639/register.js"
    },
    {
      "id": "coal-350-616",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-616/register.js"
    },
    {
      "id": "coal-350-618",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-618/register.js"
    },
    {
      "id": "coal-350-620",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-620/register.js"
    },
    {
      "id": "coal-350-536",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-536/register.js"
    },
    {
      "id": "coal-350-543",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-543/register.js"
    },
    {
      "id": "coal-350-550",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-550/register.js"
    },
    {
      "id": "coal-350-589",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-589/register.js"
    },
    {
      "id": "coal-350-591",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-591/register.js"
    },
    {
      "id": "coal-350-593",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-350-593/register.js"
    },
    {
      "id": "coal-348-466",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-348-466/register.js"
    },
    {
      "id": "coal-348-467",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-348-467/register.js"
    },
    {
      "id": "coal-348-478",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-348-478/register.js"
    },
    {
      "id": "coal-348-480",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-348-480/register.js"
    },
    {
      "id": "coal-351-584",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-584/register.js"
    },
    {
      "id": "coal-351-586",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-586/register.js"
    },
    {
      "id": "coal-351-588",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-588/register.js"
    },
    {
      "id": "coal-351-590",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-590/register.js"
    },
    {
      "id": "coal-351-592",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-592/register.js"
    },
    {
      "id": "coal-351-594",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-594/register.js"
    },
    {
      "id": "coal-351-621",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-621/register.js"
    },
    {
      "id": "coal-351-623",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-623/register.js"
    },
    {
      "id": "coal-351-625",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-625/register.js"
    },
    {
      "id": "coal-351-627",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-627/register.js"
    },
    {
      "id": "coal-351-629",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-629/register.js"
    },
    {
      "id": "coal-351-631",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.fall",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-351-631/register.js"
    },
    {
      "id": "coal-346-329",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.extension",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-346-329/register.js"
    },
    {
      "id": "coal-346-325",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.extension",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-346-325/register.js"
    },
    {
      "id": "coal-346-327",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.extension",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-346-327/register.js"
    },
    {
      "id": "coal-346-323",
      "src": "src/components/coal/leaf.ts",
      "language": "ts",
      "behaviorRef": "project.coal.extension",
      "version": "1.0.0",
      "compiled": ".flamo/generated/interactions/revisions/0cd04544b1ba20b6735b/scripts/coal-346-323/register.js"
    }
  ],
  "slots": {
    "robot": {
      "name": "robot",
      "description": "<p>机器人占位</p>",
      "required": false,
      "target": "166:732",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm3A__166_1": {
      "name": "Alarm3A__166_1",
      "required": false,
      "target": "166:735",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm3A__169_0": {
      "name": "Alarm3A__169_0",
      "required": false,
      "target": "169:979",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm1A__176_0": {
      "name": "Alarm1A__176_0",
      "required": false,
      "target": "176:326",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm2A": {
      "name": "Alarm2A",
      "required": false,
      "target": "176:329",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm2B": {
      "name": "Alarm2B",
      "required": false,
      "target": "176:332",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm3B": {
      "name": "Alarm3B",
      "required": false,
      "target": "176:335",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm4A": {
      "name": "Alarm4A",
      "required": false,
      "target": "176:339",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm6A": {
      "name": "Alarm6A",
      "required": false,
      "target": "176:342",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm6C": {
      "name": "Alarm6C",
      "required": false,
      "target": "176:345",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm6D": {
      "name": "Alarm6D",
      "required": false,
      "target": "176:348",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm6B": {
      "name": "Alarm6B",
      "required": false,
      "target": "176:351",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm5A": {
      "name": "Alarm5A",
      "required": false,
      "target": "176:354",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm5B": {
      "name": "Alarm5B",
      "required": false,
      "target": "176:357",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1A皮带电机电流": {
      "name": "1A皮带电机电流",
      "required": false,
      "target": "176:361",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1B皮带电机电流": {
      "name": "1B皮带电机电流",
      "required": false,
      "target": "176:362",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2A皮带电机电流": {
      "name": "2A皮带电机电流",
      "required": false,
      "target": "176:364",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2B皮带电机电流": {
      "name": "2B皮带电机电流",
      "required": false,
      "target": "176:365",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "3A皮带电机电流": {
      "name": "3A皮带电机电流",
      "required": false,
      "target": "176:366",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "3B皮带电机电流": {
      "name": "3B皮带电机电流",
      "required": false,
      "target": "176:367",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "4A皮带电机电流": {
      "name": "4A皮带电机电流",
      "required": false,
      "target": "176:368",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "4B皮带电机电流": {
      "name": "4B皮带电机电流",
      "required": false,
      "target": "176:369",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "5B皮带电机电流": {
      "name": "5B皮带电机电流",
      "required": false,
      "target": "176:371",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "6A皮带电机电流": {
      "name": "6A皮带电机电流",
      "required": false,
      "target": "176:372",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "6B皮带电机电流": {
      "name": "6B皮带电机电流",
      "required": false,
      "target": "176:373",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "6C皮带电机电流": {
      "name": "6C皮带电机电流",
      "required": false,
      "target": "176:374",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "6D皮带电机电流": {
      "name": "6D皮带电机电流",
      "required": false,
      "target": "176:375",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1F原煤仓料位": {
      "name": "1F原煤仓料位",
      "required": false,
      "target": "187:866",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1E原煤仓料位": {
      "name": "1E原煤仓料位",
      "required": false,
      "target": "187:1534",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1D原煤仓料位": {
      "name": "1D原煤仓料位",
      "required": false,
      "target": "187:1540",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1C原煤仓料位": {
      "name": "1C原煤仓料位",
      "required": false,
      "target": "187:1543",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1B原煤仓料位": {
      "name": "1B原煤仓料位",
      "required": false,
      "target": "187:1546",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "1A原煤仓料位": {
      "name": "1A原煤仓料位",
      "required": false,
      "target": "187:1549",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2F原煤仓料位": {
      "name": "2F原煤仓料位",
      "required": false,
      "target": "187:1552",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2E原煤仓料位": {
      "name": "2E原煤仓料位",
      "required": false,
      "target": "187:1554",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2D原煤仓料位": {
      "name": "2D原煤仓料位",
      "required": false,
      "target": "187:1556",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2C原煤仓料位": {
      "name": "2C原煤仓料位",
      "required": false,
      "target": "187:1558",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2B原煤仓料位": {
      "name": "2B原煤仓料位",
      "required": false,
      "target": "187:1560",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "2A原煤仓料位": {
      "name": "2A原煤仓料位",
      "required": false,
      "target": "187:1562",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm4B": {
      "name": "Alarm4B",
      "required": false,
      "target": "193:195",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "5A皮带电机电流": {
      "name": "5A皮带电机电流",
      "required": false,
      "target": "197:313",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm1A2": {
      "name": "Alarm1A2",
      "required": false,
      "target": "316:508",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm6C2": {
      "name": "Alarm6C2",
      "required": false,
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm1A__325_2": {
      "name": "Alarm1A__325_2",
      "required": false,
      "target": "325:942",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Alarm1B": {
      "name": "Alarm1B",
      "required": false,
      "target": "325:944",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "Robot": {
      "name": "Robot",
      "required": false,
      "target": "344:1116",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "消防高位水箱水位": {
      "name": "消防高位水箱水位",
      "required": false,
      "target": "344:1123",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    }
  },
  "startup": {
    "deferredPaintNodeIds": [
      "348:455",
      "348:452",
      "348:454",
      "348:460",
      "187:1575",
      "258:378",
      "187:1580",
      "258:377",
      "187:1585",
      "258:376",
      "187:1590",
      "187:1588",
      "187:1589",
      "298:343",
      "187:1595",
      "187:1593",
      "187:1594",
      "316:897",
      "187:1600",
      "187:1598",
      "187:1599",
      "316:924",
      "187:1605",
      "258:371",
      "187:1610",
      "258:367",
      "187:1615",
      "261:1243",
      "187:1620",
      "261:1242",
      "187:1625",
      "261:1244",
      "187:1630",
      "261:1245",
      "261:1230",
      "261:1226",
      "261:1229",
      "271:1618",
      "271:1597",
      "271:1595",
      "271:1596",
      "271:1617"
    ]
  },
  "documentation": {
    "schemaVersion": 1,
    "interactions": "interactions.json",
    "guide": "INTERACTIONS.md",
    "api": "INTERACTION_API.md",
    "integrity": "sha256:bd94d532a80276370efac585a370cd652b334b63eca02c8c575ea151899a9e09"
  },
  "integration": {
    "projectId": "db733b85-ac2c-47ff-9002-c87e18304dfe",
    "contractId": "sha256:2cc998b0400095261d9ab6f8a9b38d3491812b8833c0d72c9eb491045c06aa7a",
    "artifactRevision": "local-0cd04544b1ba20b6735b"
  },
  "interactionTargets": {
    "target-513e49dfcc2d7155": {
      "runtimeRef": "166:730"
    },
    "target-566c66dc7a3f87af": {
      "runtimeRef": "94:101651"
    },
    "target-d9c1b95473528e73": {
      "runtimeRef": "94:101273"
    },
    "target-5cf51a1976b6a55d": {
      "runtimeRef": "94:101280"
    },
    "target-544bed1971cf2b3c": {
      "runtimeRef": "94:101287"
    },
    "target-e6c2bf225159b39b": {
      "runtimeRef": "94:101295"
    },
    "target-de189a224c709412": {
      "runtimeRef": "94:101296"
    },
    "target-4d1356e5019089cc": {
      "runtimeRef": "94:101669"
    },
    "target-6066695a3c412f1e": {
      "runtimeRef": "197:296"
    },
    "target-674d04eb58c29897": {
      "runtimeRef": "94:101673"
    },
    "target-b2befc59b63dba72": {
      "runtimeRef": "221:960"
    },
    "target-686721404a202e10": {
      "runtimeRef": "258:434"
    },
    "target-0ecc22caa780730d": {
      "runtimeRef": "94:101635"
    },
    "target-e795fc63e19accd8": {
      "runtimeRef": "94:101210"
    },
    "target-aa19e163be89a291": {
      "runtimeRef": "94:101217"
    },
    "target-ed3ff5bbff03735e": {
      "runtimeRef": "278:3729"
    },
    "target-ab73134c60481177": {
      "runtimeRef": "209:640"
    },
    "target-6de274b3a3fcd2a1": {
      "runtimeRef": "209:721"
    },
    "target-a14ff0d387157efc": {
      "runtimeRef": "94:101647"
    },
    "target-0c90a475a0ba6ebe": {
      "runtimeRef": "94:101238"
    },
    "target-f2f21f3a4b0a02c6": {
      "runtimeRef": "94:101245"
    },
    "target-4866c375c26495ad": {
      "runtimeRef": "94:101231"
    },
    "target-2cb98d449e748dc0": {
      "runtimeRef": "225:984"
    },
    "target-b33daf3756eba1cd": {
      "runtimeRef": "258:424"
    },
    "target-a60136ca6be84e51": {
      "runtimeRef": "94:101639"
    },
    "target-d7f6e95e93648652": {
      "runtimeRef": "94:101313"
    },
    "target-0345b25eabeb732f": {
      "runtimeRef": "94:101314"
    },
    "target-0bfcdb5eb0df23e0": {
      "runtimeRef": "94:101315"
    },
    "target-f9c28d5ea64a62e6": {
      "runtimeRef": "94:101317"
    },
    "target-9a7ac65e70534e73": {
      "runtimeRef": "94:101318"
    },
    "target-28302efde2b57895": {
      "runtimeRef": "94:101785"
    },
    "target-0d4cb3fdd3393d7a": {
      "runtimeRef": "94:101780"
    },
    "target-136f64c18c46fe3a": {
      "runtimeRef": "94:101627"
    },
    "target-ec267eca93e0f2b9": {
      "runtimeRef": "94:101631"
    },
    "target-577bf227acfc1da7": {
      "runtimeRef": "298:347"
    },
    "target-361508c19fe67e8e": {
      "runtimeRef": "94:101623"
    },
    "target-5076b01f1caaed58": {
      "runtimeRef": "298:359"
    },
    "target-1bce56bb48a9de9b": {
      "runtimeRef": "94:101619"
    },
    "target-f927b2bb3508ab47": {
      "runtimeRef": "94:101615"
    },
    "target-d5a80ebb20af8733": {
      "runtimeRef": "94:101611"
    },
    "target-2127563b6875a93f": {
      "runtimeRef": "94:101350"
    },
    "target-29047f3b6cafb630": {
      "runtimeRef": "94:101351"
    },
    "target-0f08083b5df7affd": {
      "runtimeRef": "94:101352"
    },
    "target-fda7b23b541c852b": {
      "runtimeRef": "94:101354"
    },
    "target-065edb3b591035dc": {
      "runtimeRef": "94:101355"
    },
    "target-44a760eb45231843": {
      "runtimeRef": "94:101677"
    },
    "target-3c69f922f41bd293": {
      "runtimeRef": "94:101387"
    },
    "target-9bb2c0232a149a06": {
      "runtimeRef": "94:101388"
    },
    "target-931697232537b10d": {
      "runtimeRef": "94:101389"
    },
    "target-a9f4271a1492fd34": {
      "runtimeRef": "94:101391"
    },
    "target-8ff7b01a05daf701": {
      "runtimeRef": "94:101392"
    }
  },
  "assets": [
    {
      "hash": "ed137a3558ed7616f1654bee8c8139c9d6e736c2",
      "path": "dist/assets/images/ed137a3558ed7616f1654bee8c8139c9d6e736c2.png"
    },
    {
      "hash": "8c760352c23eeb30365a03cf15a27b2de07eef6e",
      "path": "dist/assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e"
    },
    {
      "hash": "1e048a5ca5b18e8c73a50096c67788db1601fd79",
      "path": "dist/assets/images/1e048a5ca5b18e8c73a50096c67788db1601fd79.png"
    },
    {
      "hash": "36528aec5be02fd452abe4e05d25364bc5348878",
      "path": "dist/assets/images/36528aec5be02fd452abe4e05d25364bc5348878.png"
    },
    {
      "hash": "751f96bfce77804488949adc823848b8eed29765",
      "path": "dist/assets/images/751f96bfce77804488949adc823848b8eed29765.png"
    },
    {
      "hash": "5aa0613bf641e205ca8402dab946997b8665fb0e",
      "path": "dist/assets/images/5aa0613bf641e205ca8402dab946997b8665fb0e.png"
    },
    {
      "hash": "e978a323a17a1c6ee258302943d38f0e389e9674",
      "path": "dist/assets/images/e978a323a17a1c6ee258302943d38f0e389e9674.png"
    },
    {
      "hash": "f0f702eda5d3d078a55e9aeaf97f9b42dd10dc40",
      "path": "dist/assets/images/f0f702eda5d3d078a55e9aeaf97f9b42dd10dc40.png"
    },
    {
      "hash": "f8347cd3a2b196928d8b4d0fe6ee360ff822a7b8",
      "path": "dist/assets/images/f8347cd3a2b196928d8b4d0fe6ee360ff822a7b8.png"
    }
  ],
  "compiledResources": {
    "schema": "flamo.resources/2",
    "manifest": "dist/resources/artifact.json",
    "integrity": "sha256:f7e34a4e9a502d88daf47ec86e83a5ef5a8a1408b5c28a1bf012b98e77beb93a",
    "report": {
      "compiler": "flamo.runtime-resources/1",
      "revision": "local-0cd04544b1ba20b6735b",
      "manifestBytes": 1421863,
      "binaryBytes": 155225,
      "blocks": 304,
      "references": 1274,
      "retained": [
        "selected dependency closure",
        "dynamic scripts and variables",
        "unknown extensions"
      ],
      "decoding": "instance-owned mutable arrays"
    }
  },
  "packaging": {
    "sourceMap": false,
    "includeResources": false,
    "cdnBase": new URL('.', __flamoCdn.viewport).href,
    "sharedResources": __flamoCdn,
    "interactions": "local",
    "boundaryNodeId": "166:730",
    "sourceArtifact": "view/data/artifact.flamo.json",
    "artifactRevision": "local-0cd04544b1ba20b6735b"
  },
  "contract": {
    "components": [
      {
        "nodeId": "166:730",
        "name": "输煤组件",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/166:730",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "slots": {
            "robot__166_0": {
              "name": "robot",
              "description": "<p>机器人占位</p>",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "166:732",
              "outlets": [
                {
                  "outletId": "robot:166%3A732",
                  "target": "166:732"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "166:0",
                "name": "robot",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "description": "<p>机器人占位</p>",
                "bindingProjection": "metadata"
              }
            },
            "alarm3A__166_1": {
              "name": "Alarm3A__166_1",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "166:735",
              "outlets": [
                {
                  "outletId": "alarm3A__166_1:166%3A735",
                  "target": "166:735"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "166:1",
                "name": "Alarm3A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm3A__169_0": {
              "name": "Alarm3A__169_0",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "169:979",
              "outlets": [
                {
                  "outletId": "alarm3A:169%3A979",
                  "target": "169:979"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "169:0",
                "name": "Alarm3A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "metadata"
              }
            },
            "alarm1A__176_0": {
              "name": "Alarm1A__176_0",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:326",
              "outlets": [
                {
                  "outletId": "alarm1A:176%3A326",
                  "target": "176:326"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:0",
                "name": "Alarm1A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "metadata"
              }
            },
            "alarm2A": {
              "name": "Alarm2A",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:329",
              "outlets": [
                {
                  "outletId": "alarm2A:176%3A329",
                  "target": "176:329"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:1",
                "name": "Alarm2A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm2B": {
              "name": "Alarm2B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:332",
              "outlets": [
                {
                  "outletId": "alarm2B:176%3A332",
                  "target": "176:332"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:2",
                "name": "Alarm2B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm3B": {
              "name": "Alarm3B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:335",
              "outlets": [
                {
                  "outletId": "alarm3B:176%3A335",
                  "target": "176:335"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:3",
                "name": "Alarm3B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm4A": {
              "name": "Alarm4A",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:339",
              "outlets": [
                {
                  "outletId": "alarm4A:176%3A339",
                  "target": "176:339"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:4",
                "name": "Alarm4A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm6A": {
              "name": "Alarm6A",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:342",
              "outlets": [
                {
                  "outletId": "alarm6A:176%3A342",
                  "target": "176:342"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:5",
                "name": "Alarm6A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm6C": {
              "name": "Alarm6C",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:345",
              "outlets": [
                {
                  "outletId": "alarm6C:176%3A345",
                  "target": "176:345"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:6",
                "name": "Alarm6C",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm6D": {
              "name": "Alarm6D",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:348",
              "outlets": [
                {
                  "outletId": "alarm6D:176%3A348",
                  "target": "176:348"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:7",
                "name": "Alarm6D",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm6B": {
              "name": "Alarm6B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:351",
              "outlets": [
                {
                  "outletId": "alarm6B:176%3A351",
                  "target": "176:351"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:8",
                "name": "Alarm6B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm5A": {
              "name": "Alarm5A",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:354",
              "outlets": [
                {
                  "outletId": "alarm5A:176%3A354",
                  "target": "176:354"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:9",
                "name": "Alarm5A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm5B": {
              "name": "Alarm5B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:357",
              "outlets": [
                {
                  "outletId": "alarm5B:176%3A357",
                  "target": "176:357"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:10",
                "name": "Alarm5B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1A皮带电机电流": {
              "name": "1A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:361",
              "outlets": [
                {
                  "outletId": "1A皮带电机电流:176%3A361",
                  "target": "176:361"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:12",
                "name": "1A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1B皮带电机电流": {
              "name": "1B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:362",
              "outlets": [
                {
                  "outletId": "1B皮带电机电流:176%3A362",
                  "target": "176:362"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:13",
                "name": "1B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2A皮带电机电流": {
              "name": "2A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:364",
              "outlets": [
                {
                  "outletId": "2A皮带电机电流:176%3A364",
                  "target": "176:364"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:14",
                "name": "2A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2B皮带电机电流": {
              "name": "2B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:365",
              "outlets": [
                {
                  "outletId": "2B皮带电机电流:176%3A365",
                  "target": "176:365"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:15",
                "name": "2B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "3A皮带电机电流": {
              "name": "3A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:366",
              "outlets": [
                {
                  "outletId": "3A皮带电机电流:176%3A366",
                  "target": "176:366"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:16",
                "name": "3A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "3B皮带电机电流": {
              "name": "3B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:367",
              "outlets": [
                {
                  "outletId": "3B皮带电机电流:176%3A367",
                  "target": "176:367"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:17",
                "name": "3B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "4A皮带电机电流": {
              "name": "4A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:368",
              "outlets": [
                {
                  "outletId": "4A皮带电机电流:176%3A368",
                  "target": "176:368"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:18",
                "name": "4A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "4B皮带电机电流": {
              "name": "4B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:369",
              "outlets": [
                {
                  "outletId": "4B皮带电机电流:176%3A369",
                  "target": "176:369"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:19",
                "name": "4B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "5B皮带电机电流": {
              "name": "5B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:371",
              "outlets": [
                {
                  "outletId": "5B皮带电机电流:176%3A371",
                  "target": "176:371"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:21",
                "name": "5B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "6A皮带电机电流": {
              "name": "6A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:372",
              "outlets": [
                {
                  "outletId": "6A皮带电机电流:176%3A372",
                  "target": "176:372"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:22",
                "name": "6A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "6B皮带电机电流": {
              "name": "6B皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:373",
              "outlets": [
                {
                  "outletId": "6B皮带电机电流:176%3A373",
                  "target": "176:373"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:23",
                "name": "6B皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "6C皮带电机电流": {
              "name": "6C皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:374",
              "outlets": [
                {
                  "outletId": "6C皮带电机电流:176%3A374",
                  "target": "176:374"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:24",
                "name": "6C皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "6D皮带电机电流": {
              "name": "6D皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "176:375",
              "outlets": [
                {
                  "outletId": "6D皮带电机电流:176%3A375",
                  "target": "176:375"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "176:25",
                "name": "6D皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1F原煤仓料位": {
              "name": "1F原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:866",
              "outlets": [
                {
                  "outletId": "1F原煤仓料位:187%3A866",
                  "target": "187:866"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:28",
                "name": "1F原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1E原煤仓料位": {
              "name": "1E原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1534",
              "outlets": [
                {
                  "outletId": "1E原煤仓料位:187%3A1534",
                  "target": "187:1534"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:29",
                "name": "1E原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1D原煤仓料位": {
              "name": "1D原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1540",
              "outlets": [
                {
                  "outletId": "1D原煤仓料位:187%3A1540",
                  "target": "187:1540"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:30",
                "name": "1D原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1C原煤仓料位": {
              "name": "1C原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1543",
              "outlets": [
                {
                  "outletId": "1C原煤仓料位:187%3A1543",
                  "target": "187:1543"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:31",
                "name": "1C原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1B原煤仓料位": {
              "name": "1B原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1546",
              "outlets": [
                {
                  "outletId": "1B原煤仓料位:187%3A1546",
                  "target": "187:1546"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:32",
                "name": "1B原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "1A原煤仓料位": {
              "name": "1A原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1549",
              "outlets": [
                {
                  "outletId": "1A原煤仓料位:187%3A1549",
                  "target": "187:1549"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:33",
                "name": "1A原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2F原煤仓料位": {
              "name": "2F原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1552",
              "outlets": [
                {
                  "outletId": "2F原煤仓料位:187%3A1552",
                  "target": "187:1552"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:34",
                "name": "2F原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2E原煤仓料位": {
              "name": "2E原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1554",
              "outlets": [
                {
                  "outletId": "2E原煤仓料位:187%3A1554",
                  "target": "187:1554"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:35",
                "name": "2E原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2D原煤仓料位": {
              "name": "2D原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1556",
              "outlets": [
                {
                  "outletId": "2D原煤仓料位:187%3A1556",
                  "target": "187:1556"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:36",
                "name": "2D原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2C原煤仓料位": {
              "name": "2C原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1558",
              "outlets": [
                {
                  "outletId": "2C原煤仓料位:187%3A1558",
                  "target": "187:1558"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:37",
                "name": "2C原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2B原煤仓料位": {
              "name": "2B原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1560",
              "outlets": [
                {
                  "outletId": "2B原煤仓料位:187%3A1560",
                  "target": "187:1560"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:38",
                "name": "2B原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "2A原煤仓料位": {
              "name": "2A原煤仓料位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "187:1562",
              "outlets": [
                {
                  "outletId": "2A原煤仓料位:187%3A1562",
                  "target": "187:1562"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "187:39",
                "name": "2A原煤仓料位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm4B": {
              "name": "Alarm4B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "193:195",
              "outlets": [
                {
                  "outletId": "alarm4B:193%3A195",
                  "target": "193:195"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "193:0",
                "name": "Alarm4B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "5A皮带电机电流": {
              "name": "5A皮带电机电流",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "197:313",
              "outlets": [
                {
                  "outletId": "5A皮带电机电流:197%3A313",
                  "target": "197:313"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "197:5",
                "name": "5A皮带电机电流",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm1A2": {
              "name": "Alarm1A2",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "316:508",
              "outlets": [
                {
                  "outletId": "alarm1A2:316%3A508",
                  "target": "316:508"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "316:0",
                "name": "Alarm1A2",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "metadata"
              }
            },
            "alarm6C2": {
              "name": "Alarm6C2",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "source": "figma",
              "figma": {
                "id": "325:1",
                "name": "Alarm6C2",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "metadata"
              }
            },
            "alarm1A__325_2": {
              "name": "Alarm1A__325_2",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "325:942",
              "outlets": [
                {
                  "outletId": "alarm1A__325_2:325%3A942",
                  "target": "325:942"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "325:2",
                "name": "Alarm1A",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "alarm1B": {
              "name": "Alarm1B",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "325:944",
              "outlets": [
                {
                  "outletId": "alarm1B:325%3A944",
                  "target": "325:944"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "325:3",
                "name": "Alarm1B",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "robot__344_0": {
              "name": "Robot",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "344:1116",
              "outlets": [
                {
                  "outletId": "robot__344_0:344%3A1116",
                  "target": "344:1116"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "344:0",
                "name": "Robot",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "消防高位水箱水位": {
              "name": "消防高位水箱水位",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "344:1123",
              "outlets": [
                {
                  "outletId": "消防高位水箱水位:344%3A1123",
                  "target": "344:1123"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "344:1",
                "name": "消防高位水箱水位",
                "type": "SLOT",
                "nodeId": "166:730",
                "projection": "native",
                "bindingProjection": "native"
              }
            }
          },
          "events": {
            "coalStateChange": {
              "payload": {
                "devices": "unknown",
                "epoch": "unknown",
                "robot": "unknown",
                "values": "unknown"
              },
              "source": "script",
              "generatedBy": "node-script-public-surface@1",
              "scriptId": "coal-system",
              "scriptSrc": "src/components/coal/script.ts"
            }
          },
          "imperative": {
            "applyPointValues": {
              "args": {
                "valuesInput": "unknown"
              },
              "returns": "void",
              "source": "script",
              "generatedBy": "node-script-public-surface@1",
              "scriptId": "coal-system",
              "scriptSrc": "src/components/coal/script.ts"
            },
            "getCoalState": {
              "args": {},
              "returns": "unknown",
              "source": "script",
              "generatedBy": "node-script-public-surface@1",
              "scriptId": "coal-system",
              "scriptSrc": "src/components/coal/script.ts"
            }
          },
          "parameters": {
            "uiBindIds": {
              "type": "array",
              "schema": {
                "anyOf": [
                  {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "minLength": 1
                        },
                        "notes": {
                          "type": "string"
                        },
                        "value": {
                          "anyOf": [
                            {
                              "type": "number"
                            },
                            {
                              "type": "boolean"
                            },
                            {
                              "type": "null"
                            },
                            {
                              "type": "object",
                              "properties": {
                                "left": {
                                  "type": [
                                    "boolean",
                                    "null"
                                  ]
                                },
                                "right": {
                                  "type": [
                                    "boolean",
                                    "null"
                                  ]
                                }
                              },
                              "required": [
                                "left",
                                "right"
                              ],
                              "additionalProperties": false
                            }
                          ]
                        }
                      },
                      "required": [
                        "id",
                        "value"
                      ],
                      "additionalProperties": true
                    }
                  },
                  {
                    "type": "object",
                    "additionalProperties": {
                      "anyOf": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "boolean"
                        },
                        {
                          "type": "null"
                        },
                        {
                          "type": "object",
                          "properties": {
                            "left": {
                              "type": [
                                "boolean",
                                "null"
                              ]
                            },
                            "right": {
                              "type": [
                                "boolean",
                                "null"
                              ]
                            }
                          },
                          "required": [
                            "left",
                            "right"
                          ],
                          "additionalProperties": false
                        }
                      ]
                    }
                  }
                ]
              },
              "default": [],
              "attribute": false,
              "description": "Primary: [{id, notes?, value}], default []; legacy config-ID Record accepted. Complete snapshot replacement; missing IDs clear to unknown. notes is metadata only; last duplicate ID wins. Host-owned data only."
            }
          }
        }
      },
      {
        "nodeId": "94:101607",
        "name": "皮带电机",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/94:101607",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "djRun": {
              "type": "number",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      },
      {
        "nodeId": "94:101763",
        "name": "三通",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/94:101763",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "leftRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            },
            "rightRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      },
      {
        "nodeId": "209:639",
        "name": "叶轮给煤机",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/209:639",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "gmjPosition1": {
              "type": "number",
              "description": "0..53; width = live mounted component root content width * value / 53. Missing/invalid preserves last valid or authored width.",
              "schema": {
                "type": "number",
                "minimum": 0,
                "maximum": 53
              }
            },
            "gmjPosition2": {
              "type": "number",
              "description": "0..53; width = live mounted component root content width * value / 53. Missing/invalid preserves last valid or authored width.",
              "schema": {
                "type": "number",
                "minimum": 0,
                "maximum": 53
              }
            },
            "gmjRun1": {
              "type": "boolean",
              "description": "True: original running image; false or missing: original stopped image. Independent per feeder.",
              "default": false
            },
            "gmjRun2": {
              "type": "boolean",
              "description": "True: original running image; false or missing: original stopped image. Independent per feeder.",
              "default": false
            }
          }
        }
      },
      {
        "nodeId": "94:101209",
        "name": "落煤挡板-斜皮带",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/94:101209",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "taiqiRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            },
            "luoxiaRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            },
            "zhongjianRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      },
      {
        "nodeId": "94:101272",
        "name": "落煤挡板-横皮带",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/94:101272",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "taiqiRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            },
            "luoxiaRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            },
            "zhongjianRun": {
              "type": "boolean",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      },
      {
        "nodeId": "209:818",
        "name": "碎煤机",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/209:818",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "smjRun": {
              "type": "number",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      },
      {
        "nodeId": "221:951",
        "name": "滚轴筛",
        "sourceOfTruth": "view/data/artifact.flamo.json#nodeArtifacts/221:951",
        "surface": {
          "componentPropertiesVersion": "1.0",
          "parameters": {
            "coalInput": {
              "type": "object",
              "description": "Local semantic device state; unknown by default"
            },
            "gzRun": {
              "type": "number",
              "description": "Annotation property; omitted/null is unknown. No implicit stopped value."
            }
          }
        }
      }
    ],
    "bindings": [
      {
        "id": "coal-209-818",
        "kind": "node-script",
        "nodeId": "209:818",
        "source": "src/components/coal/device-209-818.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.crusher",
        "version": "1.0.0",
        "roleBindings": {
          "root": "209:818",
          "on1": "339:389",
          "off1": "339:378"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-221-951",
        "kind": "node-script",
        "nodeId": "221:951",
        "source": "src/components/coal/device-221-951.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.screen",
        "version": "1.0.0",
        "roleBindings": {
          "root": "221:951",
          "on1": "241:279",
          "off1": "225:977"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-94-101272",
        "kind": "node-script",
        "nodeId": "94:101272",
        "source": "src/components/coal/device-94-101272.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.plough",
        "version": "1.0.0",
        "roleBindings": {
          "root": "94:101272",
          "parts1": "94:101270",
          "parts2": "94:101268",
          "parts3": "94:101269"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-94-101209",
        "kind": "node-script",
        "nodeId": "94:101209",
        "source": "src/components/coal/device-94-101209.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.plough",
        "version": "1.0.0",
        "roleBindings": {
          "root": "94:101209",
          "parts1": "94:101201",
          "parts2": "94:101199",
          "parts3": "94:101200"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-94-101607",
        "kind": "node-script",
        "nodeId": "94:101607",
        "source": "src/components/coal/device-94-101607.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.motor",
        "version": "1.0.0",
        "roleBindings": {
          "root": "94:101607",
          "on1": "307:482",
          "off1": "307:458"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-94-101763",
        "kind": "node-script",
        "nodeId": "94:101763",
        "source": "src/components/coal/device-94-101763.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.tee",
        "version": "1.0.0",
        "roleBindings": {
          "root": "94:101763",
          "on1": "241:320",
          "on2": "94:101760",
          "on3": "94:101759",
          "off1": "94:101761",
          "off2": "241:319",
          "off3": "241:318"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-209-639",
        "kind": "node-script",
        "nodeId": "209:639",
        "source": "src/components/coal/device-209-639.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.feeder",
        "version": "1.0.0",
        "roleBindings": {
          "root": "209:639",
          "on1": "225:1068",
          "on2": "225:1086",
          "off1": "225:1064",
          "off2": "225:1087",
          "bars1": "334:338",
          "bars2": "334:361",
          "references1": "209:639",
          "references2": "209:639"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-system",
        "kind": "node-script",
        "nodeId": "166:730",
        "source": "src/components/coal/script.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.system",
        "version": "1.0.0",
        "roleBindings": {
          "root": "166:730"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1572",
        "kind": "node-script",
        "nodeId": "187:1572",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1572"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1577",
        "kind": "node-script",
        "nodeId": "187:1577",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1577"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1582",
        "kind": "node-script",
        "nodeId": "187:1582",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1582"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1587",
        "kind": "node-script",
        "nodeId": "187:1587",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1587"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1592",
        "kind": "node-script",
        "nodeId": "187:1592",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1592"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1597",
        "kind": "node-script",
        "nodeId": "187:1597",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1597"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1602",
        "kind": "node-script",
        "nodeId": "187:1602",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1602"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1607",
        "kind": "node-script",
        "nodeId": "187:1607",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1607"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1612",
        "kind": "node-script",
        "nodeId": "187:1612",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1612"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1617",
        "kind": "node-script",
        "nodeId": "187:1617",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1617"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1622",
        "kind": "node-script",
        "nodeId": "187:1622",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1622"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-1627",
        "kind": "node-script",
        "nodeId": "187:1627",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:1627"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-261-1228",
        "kind": "node-script",
        "nodeId": "261:1228",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "261:1228"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-271-1594",
        "kind": "node-script",
        "nodeId": "271:1594",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.flow",
        "version": "1.0.0",
        "roleBindings": {
          "root": "271:1594"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100532",
        "kind": "node-script",
        "nodeId": "91:100532",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100532"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100533",
        "kind": "node-script",
        "nodeId": "91:100533",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100533"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100542",
        "kind": "node-script",
        "nodeId": "91:100542",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100542"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100543",
        "kind": "node-script",
        "nodeId": "91:100543",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100543"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-197-310",
        "kind": "node-script",
        "nodeId": "197:310",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "197:310"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-197-311",
        "kind": "node-script",
        "nodeId": "197:311",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "197:311"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-197-312",
        "kind": "node-script",
        "nodeId": "197:312",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "197:312"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100651",
        "kind": "node-script",
        "nodeId": "91:100651",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100651"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100652",
        "kind": "node-script",
        "nodeId": "91:100652",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100652"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100512",
        "kind": "node-script",
        "nodeId": "91:100512",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100512"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100513",
        "kind": "node-script",
        "nodeId": "91:100513",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100513"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-339",
        "kind": "node-script",
        "nodeId": "176:339",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:339"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-83-99032",
        "kind": "node-script",
        "nodeId": "83:99032",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "83:99032"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-83-99033",
        "kind": "node-script",
        "nodeId": "83:99033",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "83:99033"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-83-99034",
        "kind": "node-script",
        "nodeId": "83:99034",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "83:99034"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100522",
        "kind": "node-script",
        "nodeId": "91:100522",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100522"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100523",
        "kind": "node-script",
        "nodeId": "91:100523",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100523"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100488",
        "kind": "node-script",
        "nodeId": "91:100488",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100488"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100487",
        "kind": "node-script",
        "nodeId": "91:100487",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100487"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100502",
        "kind": "node-script",
        "nodeId": "91:100502",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100502"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100503",
        "kind": "node-script",
        "nodeId": "91:100503",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100503"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100479",
        "kind": "node-script",
        "nodeId": "91:100479",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100479"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100478",
        "kind": "node-script",
        "nodeId": "91:100478",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100478"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100470",
        "kind": "node-script",
        "nodeId": "91:100470",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100470"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100469",
        "kind": "node-script",
        "nodeId": "91:100469",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100469"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100461",
        "kind": "node-script",
        "nodeId": "91:100461",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100461"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100460",
        "kind": "node-script",
        "nodeId": "91:100460",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100460"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-59-764",
        "kind": "node-script",
        "nodeId": "59:764",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "59:764"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-59-763",
        "kind": "node-script",
        "nodeId": "59:763",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "59:763"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-329",
        "kind": "node-script",
        "nodeId": "176:329",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:329"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-332",
        "kind": "node-script",
        "nodeId": "176:332",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:332"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-335",
        "kind": "node-script",
        "nodeId": "176:335",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:335"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-166-735",
        "kind": "node-script",
        "nodeId": "166:735",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "166:735"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-342",
        "kind": "node-script",
        "nodeId": "176:342",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:342"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-351",
        "kind": "node-script",
        "nodeId": "176:351",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:351"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-193-195",
        "kind": "node-script",
        "nodeId": "193:195",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "193:195"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-354",
        "kind": "node-script",
        "nodeId": "176:354",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:354"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-357",
        "kind": "node-script",
        "nodeId": "176:357",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:357"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100661",
        "kind": "node-script",
        "nodeId": "91:100661",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100661"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-91-100662",
        "kind": "node-script",
        "nodeId": "91:100662",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.wheel",
        "version": "1.0.0",
        "roleBindings": {
          "root": "91:100662"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-345",
        "kind": "node-script",
        "nodeId": "176:345",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:345"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-348",
        "kind": "node-script",
        "nodeId": "176:348",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:348"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-325-942",
        "kind": "node-script",
        "nodeId": "325:942",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "325:942"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-325-944",
        "kind": "node-script",
        "nodeId": "325:944",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.alarm",
        "version": "1.0.0",
        "roleBindings": {
          "root": "325:944"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-372",
        "kind": "node-script",
        "nodeId": "176:372",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:372"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-373",
        "kind": "node-script",
        "nodeId": "176:373",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:373"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-197-313",
        "kind": "node-script",
        "nodeId": "197:313",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "197:313"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-374",
        "kind": "node-script",
        "nodeId": "176:374",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:374"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-368",
        "kind": "node-script",
        "nodeId": "176:368",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:368"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-371",
        "kind": "node-script",
        "nodeId": "176:371",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:371"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-369",
        "kind": "node-script",
        "nodeId": "176:369",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:369"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-366",
        "kind": "node-script",
        "nodeId": "176:366",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:366"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-367",
        "kind": "node-script",
        "nodeId": "176:367",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:367"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-365",
        "kind": "node-script",
        "nodeId": "176:365",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:365"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-364",
        "kind": "node-script",
        "nodeId": "176:364",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:364"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-362",
        "kind": "node-script",
        "nodeId": "176:362",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:362"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-361",
        "kind": "node-script",
        "nodeId": "176:361",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:361"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-176-375",
        "kind": "node-script",
        "nodeId": "176:375",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.number",
        "version": "1.0.0",
        "roleBindings": {
          "root": "176:375"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100003",
        "kind": "node-script",
        "nodeId": "86:100003",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100003"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100008",
        "kind": "node-script",
        "nodeId": "86:100008",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100008"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100013",
        "kind": "node-script",
        "nodeId": "86:100013",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100013"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100018",
        "kind": "node-script",
        "nodeId": "86:100018",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100018"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100023",
        "kind": "node-script",
        "nodeId": "86:100023",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100023"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-86-100028",
        "kind": "node-script",
        "nodeId": "86:100028",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "86:100028"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-830",
        "kind": "node-script",
        "nodeId": "187:830",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:830"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-835",
        "kind": "node-script",
        "nodeId": "187:835",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:835"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-840",
        "kind": "node-script",
        "nodeId": "187:840",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:840"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-845",
        "kind": "node-script",
        "nodeId": "187:845",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:845"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-850",
        "kind": "node-script",
        "nodeId": "187:850",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:850"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-187-855",
        "kind": "node-script",
        "nodeId": "187:855",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "187:855"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-325-990",
        "kind": "node-script",
        "nodeId": "325:990",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.level",
        "version": "1.0.0",
        "roleBindings": {
          "root": "325:990"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-ui-bind-ids",
        "kind": "prop-to-script",
        "nodeId": "166:730",
        "from": "props.uiBindIds",
        "source": "src/components/coal/script.ts",
        "semantics": "[{id,notes?,value}] default []; legacy Record accepted; normalize by business ID, complete replacement, missing clears; lifecycle-owned watcher and compatibility method share pipeline",
        "verification": {
          "status": "pending"
        },
        "behaviorRef": "project.coal.system",
        "version": "1.0.0",
        "roleBindings": {
          "root": "166:730"
        }
      },
      {
        "id": "coal-351-489",
        "kind": "node-script",
        "nodeId": "351:489",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:489"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-491",
        "kind": "node-script",
        "nodeId": "351:491",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:491"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-493",
        "kind": "node-script",
        "nodeId": "351:493",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:493"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-495",
        "kind": "node-script",
        "nodeId": "351:495",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:495"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-514",
        "kind": "node-script",
        "nodeId": "351:514",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:514"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-516",
        "kind": "node-script",
        "nodeId": "351:516",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:516"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-712",
        "kind": "node-script",
        "nodeId": "350:712",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:712"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-714",
        "kind": "node-script",
        "nodeId": "350:714",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:714"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-716",
        "kind": "node-script",
        "nodeId": "350:716",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:716"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-718",
        "kind": "node-script",
        "nodeId": "350:718",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:718"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-400",
        "kind": "node-script",
        "nodeId": "351:400",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:400"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-407",
        "kind": "node-script",
        "nodeId": "351:407",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:407"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-428",
        "kind": "node-script",
        "nodeId": "351:428",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:428"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-435",
        "kind": "node-script",
        "nodeId": "351:435",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:435"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-464",
        "kind": "node-script",
        "nodeId": "351:464",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:464"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-466",
        "kind": "node-script",
        "nodeId": "351:466",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:466"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-468",
        "kind": "node-script",
        "nodeId": "351:468",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:468"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-470",
        "kind": "node-script",
        "nodeId": "351:470",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:470"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-654",
        "kind": "node-script",
        "nodeId": "350:654",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:654"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-673",
        "kind": "node-script",
        "nodeId": "350:673",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:673"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-656",
        "kind": "node-script",
        "nodeId": "350:656",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:656"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-658",
        "kind": "node-script",
        "nodeId": "350:658",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:658"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-547",
        "kind": "node-script",
        "nodeId": "351:547",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:547"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-549",
        "kind": "node-script",
        "nodeId": "351:549",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:549"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-551",
        "kind": "node-script",
        "nodeId": "351:551",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:551"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-553",
        "kind": "node-script",
        "nodeId": "351:553",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:553"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-555",
        "kind": "node-script",
        "nodeId": "351:555",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:555"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-557",
        "kind": "node-script",
        "nodeId": "351:557",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:557"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-635",
        "kind": "node-script",
        "nodeId": "350:635",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:635"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-637",
        "kind": "node-script",
        "nodeId": "350:637",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:637"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-639",
        "kind": "node-script",
        "nodeId": "350:639",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:639"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-616",
        "kind": "node-script",
        "nodeId": "350:616",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:616"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-618",
        "kind": "node-script",
        "nodeId": "350:618",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:618"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-620",
        "kind": "node-script",
        "nodeId": "350:620",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:620"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-536",
        "kind": "node-script",
        "nodeId": "350:536",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:536"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-543",
        "kind": "node-script",
        "nodeId": "350:543",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:543"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-550",
        "kind": "node-script",
        "nodeId": "350:550",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:550"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-589",
        "kind": "node-script",
        "nodeId": "350:589",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:589"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-591",
        "kind": "node-script",
        "nodeId": "350:591",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:591"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-350-593",
        "kind": "node-script",
        "nodeId": "350:593",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "350:593"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-348-466",
        "kind": "node-script",
        "nodeId": "348:466",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "348:466"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-348-467",
        "kind": "node-script",
        "nodeId": "348:467",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "348:467"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-348-478",
        "kind": "node-script",
        "nodeId": "348:478",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "348:478"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-348-480",
        "kind": "node-script",
        "nodeId": "348:480",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "348:480"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-584",
        "kind": "node-script",
        "nodeId": "351:584",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:584"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-586",
        "kind": "node-script",
        "nodeId": "351:586",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:586"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-588",
        "kind": "node-script",
        "nodeId": "351:588",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:588"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-590",
        "kind": "node-script",
        "nodeId": "351:590",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:590"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-592",
        "kind": "node-script",
        "nodeId": "351:592",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:592"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-594",
        "kind": "node-script",
        "nodeId": "351:594",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:594"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-621",
        "kind": "node-script",
        "nodeId": "351:621",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:621"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-623",
        "kind": "node-script",
        "nodeId": "351:623",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:623"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-625",
        "kind": "node-script",
        "nodeId": "351:625",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:625"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-627",
        "kind": "node-script",
        "nodeId": "351:627",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:627"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-629",
        "kind": "node-script",
        "nodeId": "351:629",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:629"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-351-631",
        "kind": "node-script",
        "nodeId": "351:631",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.fall",
        "version": "1.0.0",
        "roleBindings": {
          "root": "351:631"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-346-329",
        "kind": "node-script",
        "nodeId": "346:329",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.extension",
        "version": "1.0.0",
        "roleBindings": {
          "root": "346:329"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-346-325",
        "kind": "node-script",
        "nodeId": "346:325",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.extension",
        "version": "1.0.0",
        "roleBindings": {
          "root": "346:325"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-346-327",
        "kind": "node-script",
        "nodeId": "346:327",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.extension",
        "version": "1.0.0",
        "roleBindings": {
          "root": "346:327"
        },
        "verification": {
          "status": "pending"
        }
      },
      {
        "id": "coal-346-323",
        "kind": "node-script",
        "nodeId": "346:323",
        "source": "src/components/coal/leaf.ts",
        "mount": "artifact.nodeArtifacts",
        "scope": "166:730 and actual dependencies",
        "behaviorRef": "project.coal.extension",
        "version": "1.0.0",
        "roleBindings": {
          "root": "346:323"
        },
        "verification": {
          "status": "pending"
        }
      }
    ]
  },
  "ai": {
    "entry": "AGENTS.md",
    "usage": "README.md",
    "typeHints": "dist/flamo-coal-system.d.ts"
  },
  "foundation": {
    "ref": {
      "schemaVersion": 1,
      "namespace": "project.db733b85-ac2c-47ff-9002-c87e18304dfe",
      "id": "component-flamo-coal-system",
      "version": "0.1.0",
      "exportName": "FlamoComponent",
      "artifactRevision": "local-0cd04544b1ba20b6735b",
      "artifactHash": "sha256:f811db81d5c3e7af38d867905f4ab3f57b42bb98e88ac895b3b899ce21e62145",
      "runtimeAbi": "runtime-v1",
      "componentAbi": "sha256:19f7c8f6ec6c9c789e71fbf50c2a8a4cf7186c42e3427e6e7ebb11ff060fbba5"
    },
    "componentRef": "flamo://components/project.db733b85-ac2c-47ff-9002-c87e18304dfe/component-flamo-coal-system@0.1.0#FlamoComponent",
    "surfaceHash": "sha256:19f7c8f6ec6c9c789e71fbf50c2a8a4cf7186c42e3427e6e7ebb11ff060fbba5",
    "compositionHash": "sha256:53b36a33c76b3375428fc17b58628f8f35d26516e9b84fa5473426cee34816f4",
    "runtimeAbi": "runtime-v1",
    "componentAbi": "sha256:19f7c8f6ec6c9c789e71fbf50c2a8a4cf7186c42e3427e6e7ebb11ff060fbba5"
  },
  "distribution": {
    "loader": "dist/flamo-coal-system.loader.js",
    "loadingStyles": "dist/component-loading.css"
  }
};
const imageAssets = [{"hash":"ed137a3558ed7616f1654bee8c8139c9d6e736c2","path":".flamo/imports/assets/images/ed137a3558ed7616f1654bee8c8139c9d6e736c2.png","packagedPath":"assets/images/ed137a3558ed7616f1654bee8c8139c9d6e736c2.png"},{"hash":"8c760352c23eeb30365a03cf15a27b2de07eef6e","path":".flamo/imports/assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e","packagedPath":"assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e"},{"hash":"1e048a5ca5b18e8c73a50096c67788db1601fd79","path":".flamo/imports/assets/images/1e048a5ca5b18e8c73a50096c67788db1601fd79.png","packagedPath":"assets/images/1e048a5ca5b18e8c73a50096c67788db1601fd79.png"},{"hash":"36528aec5be02fd452abe4e05d25364bc5348878","path":".flamo/imports/assets/images/36528aec5be02fd452abe4e05d25364bc5348878.png","packagedPath":"assets/images/36528aec5be02fd452abe4e05d25364bc5348878.png"},{"hash":"751f96bfce77804488949adc823848b8eed29765","path":".flamo/imports/assets/images/751f96bfce77804488949adc823848b8eed29765.png","packagedPath":"assets/images/751f96bfce77804488949adc823848b8eed29765.png"},{"hash":"5aa0613bf641e205ca8402dab946997b8665fb0e","path":".flamo/imports/assets/images/5aa0613bf641e205ca8402dab946997b8665fb0e.png","packagedPath":"assets/images/5aa0613bf641e205ca8402dab946997b8665fb0e.png"},{"hash":"e978a323a17a1c6ee258302943d38f0e389e9674","path":".flamo/imports/assets/images/e978a323a17a1c6ee258302943d38f0e389e9674.png","packagedPath":"assets/images/e978a323a17a1c6ee258302943d38f0e389e9674.png"},{"hash":"f0f702eda5d3d078a55e9aeaf97f9b42dd10dc40","path":".flamo/imports/assets/images/f0f702eda5d3d078a55e9aeaf97f9b42dd10dc40.png","packagedPath":"assets/images/f0f702eda5d3d078a55e9aeaf97f9b42dd10dc40.png"},{"hash":"f8347cd3a2b196928d8b4d0fe6ee360ff822a7b8","path":".flamo/imports/assets/images/f8347cd3a2b196928d8b4d0fe6ee360ff822a7b8.png","packagedPath":"assets/images/f8347cd3a2b196928d8b4d0fe6ee360ff822a7b8.png"}];
const publicSurface = flamoComponentManifest.surface ?? {};
const w3cSurface = {"properties":[{"name":"uiBindIds","type":"unknown[]","required":false,"default":[]}],"attributes":[],"events":[{"name":"coalStateChange","detailType":"{ \"devices\": unknown; \"epoch\": unknown; \"robot\": unknown; \"values\": unknown }"}],"methods":[{"name":"applyPointValues","signature":"(valuesInput: unknown) => void"},{"name":"getCoalState","signature":"() => unknown"}],"slots":[{"name":"robot","description":"<p>机器人占位</p>"},{"name":"Alarm3A__166_1"},{"name":"Alarm3A__169_0"},{"name":"Alarm1A__176_0"},{"name":"Alarm2A"},{"name":"Alarm2B"},{"name":"Alarm3B"},{"name":"Alarm4A"},{"name":"Alarm6A"},{"name":"Alarm6C"},{"name":"Alarm6D"},{"name":"Alarm6B"},{"name":"Alarm5A"},{"name":"Alarm5B"},{"name":"1A皮带电机电流"},{"name":"1B皮带电机电流"},{"name":"2A皮带电机电流"},{"name":"2B皮带电机电流"},{"name":"3A皮带电机电流"},{"name":"3B皮带电机电流"},{"name":"4A皮带电机电流"},{"name":"4B皮带电机电流"},{"name":"5B皮带电机电流"},{"name":"6A皮带电机电流"},{"name":"6B皮带电机电流"},{"name":"6C皮带电机电流"},{"name":"6D皮带电机电流"},{"name":"1F原煤仓料位"},{"name":"1E原煤仓料位"},{"name":"1D原煤仓料位"},{"name":"1C原煤仓料位"},{"name":"1B原煤仓料位"},{"name":"1A原煤仓料位"},{"name":"2F原煤仓料位"},{"name":"2E原煤仓料位"},{"name":"2D原煤仓料位"},{"name":"2C原煤仓料位"},{"name":"2B原煤仓料位"},{"name":"2A原煤仓料位"},{"name":"Alarm4B"},{"name":"5A皮带电机电流"},{"name":"Alarm1A2"},{"name":"Alarm6C2"},{"name":"Alarm1A__325_2"},{"name":"Alarm1B"},{"name":"Robot"},{"name":"消防高位水箱水位"}]};
const packagingSlots = flamoComponentManifest.slots ?? {};

/** Embedded into each exported wrapper; depends only on public instance APIs. */
function installComponentPublicSurface(ElementClass, surface, definitions) {
  const values = new WeakMap();
  const collected = new WeakMap();
  const properties = new Map(surface.properties.map(property => [property.name, property]));
  const attributes = new Map(surface.attributes.map(attribute => [attribute.name, attribute.property]));
  const names = [...properties.keys(), ...surface.methods.map(method => method.name)];
  const used = new Set();
  for (const name of names) {
    if (used.has(name) || name in ElementClass.prototype || name.startsWith('_') ||
        ['ready', 'runtime', 'instance', 'app', 'flamo', 'canvas'].includes(name)) {
      throw new Error('FLAMO_PUBLIC_MEMBER_CONFLICT: ' + name);
    }
    used.add(name);
  }
  if (attributes.size !== surface.attributes.length || attributes.has('paused')) {
    throw new Error('FLAMO_PUBLIC_ATTRIBUTE_CONFLICT');
  }
  const state = element => {
    if (!values.has(element)) values.set(element, new Map());
    return values.get(element);
  };
  const fromAttribute = (element, property) => {
    const raw = property.attribute ? element.getAttribute(property.attribute) : null;
    if (raw === null) {
      const value = definitions[property.name]?.default;
      return value && typeof value === 'object' ? structuredClone(value) : value;
    }
    const definition = definitions[property.name] ?? {};
    const type = definition.schema?.type ?? definition.type;
    if (type === 'boolean') return raw === '' || raw === 'true';
    if (type === 'number' || type === 'integer') {
      const number = Number(raw);
      return Number.isFinite(number) ? number : raw;
    }
    return raw;
  };
  const write = (element, name, value) => {
    // Let Runtime validation throw before retaining a rejected value.
    if (element.isConnected && element.instance) element.instance.set(name, value);
    state(element).set(name, value);
    if (element.isConnected && element.instance) element.syncSlots();
  };
  const collect = element => Object.fromEntries([...properties].map(([name, property]) =>
    [name, state(element).has(name) ? state(element).get(name) : fromAttribute(element, property)])
    .filter(([, value]) => value !== undefined));
  for (const [name, property] of properties) {
    Object.defineProperty(ElementClass.prototype, name, {
      configurable: true, enumerable: true,
      get() {
        if (this.isConnected && this.instance) return this.instance.get(name);
        return state(this).has(name) ? state(this).get(name) : fromAttribute(this, property);
      },
      set(value) { write(this, name, value); },
    });
  }
  for (const method of surface.methods) {
    Object.defineProperty(ElementClass.prototype, method.name, {
      configurable: true, writable: true,
      value(...args) {
        if (!this.isConnected || this.getAttribute('data-flamo-state') !== 'ready' || !this.instance) {
          const error = new Error('FLAMO_COMPONENT_NOT_READY: await element.ready before calling ' + method.name);
          if (/=>\s*Promise\s*</.test(method.signature)) return Promise.reject(error);
          throw error;
        }
        return this.instance.call(method.name, ...args);
      },
    });
  }
  return {
    upgrade(element) {
      // Values assigned before customElements.define shadow prototype setters.
      for (const name of properties.keys()) {
        if (!Object.prototype.hasOwnProperty.call(element, name)) continue;
        const value = element[name];
        delete element[name];
        element[name] = value;
      }
    },
    collect(element) {
      const props = collect(element);
      collected.set(element, new Map(state(element)));
      return props;
    },
    attributeChanged(element, attribute) {
      const name = attributes.get(attribute);
      if (name !== undefined) write(element, name, fromAttribute(element, properties.get(name)));
    },
    flush(element) {
      // A host can change props while runtime.create is awaiting scene readiness.
      const initial = collected.get(element) ?? new Map();
      for (const [name, value] of state(element)) {
        if (!initial.has(name) || !Object.is(initial.get(name), value)) element.instance.set(name, value);
      }
    },
  };
}


function normalizeToNodeArray(raw) {
  if (Array.isArray(raw)) return prepareFigmaSceneNodes(raw);
  if (raw?.scene?.nodes) return prepareFigmaSceneNodes(raw.scene.nodes);
  if (raw?.document?.children) return prepareFigmaSceneNodes(raw.document.children);
  if (raw?.type && typeof raw.type === 'string') return prepareFigmaSceneNodes([raw]);
  return [];
}

function registerPackagedAssets(imageRegistry) {
  for (const image of imageAssets) {
    imageRegistry.registerUrl(image.hash, new URL('./' + image.packagedPath, import.meta.url).href);
  }
}

function propToAttribute(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function createArtifactForMount(signal) {
  const artifactData = await loadPackagedArtifact(import.meta.url, "f7e34a4e9a502d88daf47ec86e83a5ef5a8a1408b5c28a1bf012b98e77beb93a", signal);
  if (artifactData?.scene?.nodes) {
    const name = flamoComponentManifest.name;
    const boundaryNodeId = flamoComponentManifest.packaging.boundaryNodeId;
    const selected = { ...artifactData,
      exports: { [name]: { name, boundaryNodeId, surface: publicSurface,
        surfaceRef: { kind: 'nodeArtifact', nodeId: boundaryNodeId, path: 'surface' } } },
      metadata: { ...artifactData.metadata, mainExport: name } };
    return materializeCurrentArtifactComponent(selected, name);
  }
  const boundaryNodeId = flamoComponentManifest.packaging?.boundaryNodeId ?? 'artifact:main';
  const exportName = flamoComponentManifest.name ?? 'FlamoComponent';
  return {
    kind: 'flamo.artifact',
    schemaVersion: '0.1',
    scene: {
      format: 'flamo-scene-v0',
      nodes: normalizeToNodeArray(artifactData?.scene?.nodes ?? []),
    },
    nodeArtifacts: {
      [boundaryNodeId]: {
        role: 'component',
        boundary: true,
        capabilities: ['localBehavior', 'publicSurface', 'exportable'],
        surface: publicSurface,
        backend: { kind: 'flamo' },
      },
    },
    exports: {
      [exportName]: {
        name: exportName,
        boundaryNodeId,
        tagName: flamoComponentManifest.tagName,
        surfaceRef: { kind: 'nodeArtifact', nodeId: boundaryNodeId, path: 'surface' },
      },
    },
    metadata: { mainExport: exportName },
  };
}

function createFlamoApi(app) {
  const flamoApi = {
    app,
    registerProxyBinding,
    unregisterProxyBinding,
    batchUnregisterProxyBindings,
    dispatchEntityEvent,
    updateEntityReactiveState,
    createEntityHandle,
    computed,
    reactive,
    ref,
    watch,
    getGlobalEventBridge,
    getBindingCount() {
      return app?._bindingSys?.environments?.size ?? 0;
    },
    hasBinding(nodeId) {
      return app?._bindingSys?.environments?.has(nodeId) ?? false;
    },
  };
  return flamoApi;
}

async function resolvePackagedNodeScript(script) {
  if (typeof interactions.resolveNodeScript === 'function') {
    const resolved = await interactions.resolveNodeScript(script);
    if (resolved) return resolved;
  }
  const compiled = script?.compiled || (script?.id ? '.flamo/generated/interactions/scripts/' + script.id + '/register.js' : '');
  const packagedPath = String(compiled).replace(/^\.flamo\/generated\/interactions\//, "./interactions/");
  if (!packagedPath || packagedPath === String(compiled)) return null;
  return import(packagedPath);
}

export class FlamoCoalSystemElement extends HTMLElement {
  static get observedAttributes() {
    return ['paused', ...w3cSurface.attributes.map(attribute => attribute.name)];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<style>:host{display:block;position:relative;width:300px;height:150px;contain:content}.viewport{position:absolute;inset:0;overflow:hidden;opacity:0}:host([data-flamo-state="ready"]) .viewport,:host([data-flamo-state="static"]) .viewport{opacity:1}.canvas-layer{position:sticky;top:0;left:0;width:100%;height:0;z-index:1}canvas{display:block;position:absolute;top:0;left:0}.extent{pointer-events:none}.slot-collector{display:none}</style><div class="viewport" part="viewport" inert><div class="canvas-layer"><canvas part="canvas" tabindex="0"></canvas></div><div class="extent"></div></div><div class="slot-collector"><slot name="robot"></slot><slot name="Alarm3A__166_1"></slot><slot name="Alarm3A__169_0"></slot><slot name="Alarm1A__176_0"></slot><slot name="Alarm2A"></slot><slot name="Alarm2B"></slot><slot name="Alarm3B"></slot><slot name="Alarm4A"></slot><slot name="Alarm6A"></slot><slot name="Alarm6C"></slot><slot name="Alarm6D"></slot><slot name="Alarm6B"></slot><slot name="Alarm5A"></slot><slot name="Alarm5B"></slot><slot name="1A皮带电机电流"></slot><slot name="1B皮带电机电流"></slot><slot name="2A皮带电机电流"></slot><slot name="2B皮带电机电流"></slot><slot name="3A皮带电机电流"></slot><slot name="3B皮带电机电流"></slot><slot name="4A皮带电机电流"></slot><slot name="4B皮带电机电流"></slot><slot name="5B皮带电机电流"></slot><slot name="6A皮带电机电流"></slot><slot name="6B皮带电机电流"></slot><slot name="6C皮带电机电流"></slot><slot name="6D皮带电机电流"></slot><slot name="1F原煤仓料位"></slot><slot name="1E原煤仓料位"></slot><slot name="1D原煤仓料位"></slot><slot name="1C原煤仓料位"></slot><slot name="1B原煤仓料位"></slot><slot name="1A原煤仓料位"></slot><slot name="2F原煤仓料位"></slot><slot name="2E原煤仓料位"></slot><slot name="2D原煤仓料位"></slot><slot name="2C原煤仓料位"></slot><slot name="2B原煤仓料位"></slot><slot name="2A原煤仓料位"></slot><slot name="Alarm4B"></slot><slot name="5A皮带电机电流"></slot><slot name="Alarm1A2"></slot><slot name="Alarm6C2"></slot><slot name="Alarm1A__325_2"></slot><slot name="Alarm1B"></slot><slot name="Robot"></slot><slot name="消防高位水箱水位"></slot><slot></slot></div>';
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ready = null;
    this.runtime = null;
    this.instance = null;
    this.app = null;
    this.flamo = null;
    this._slotDisposers = [];
    this._lifecycle = Promise.resolve();
    this._connectionVersion = 0;
    this._retainedApp = null;
    if (Object.prototype.hasOwnProperty.call(this, 'slotStyles')) {
      const styles = this.slotStyles;
      delete this.slotStyles;
      this.slotStyles = styles;
    }
  }

  get slotStyles() { return this._slotStyles ?? ''; }

  getInteractionTarget(targetId) {
    if (!this.isConnected || this.getAttribute('data-flamo-state') !== 'ready') return null;
    return this._interactionTargets?.get(targetId) ?? null;
  }

  inspectInteractionTargets() {
    return this._interactionTargets?.inspect() ?? { generation: 0, destroyed: true, diagnostics: {} };
  }

  set slotStyles(value) {
    if (typeof value !== 'string') throw new TypeError('slotStyles must be a CSS string');
    this._slotStyles = value;
    if (!this._slotStyleElement) {
      this._slotStyleElement = this.ownerDocument.createElement('style');
      this._slotStyleElement.dataset.flamoSlotStyles = '';
      this.shadowRoot.appendChild(this._slotStyleElement);
    }
    this._slotStyleElement.textContent = value;
  }

  connectedCallback() {
    publicBridge.upgrade(this);
    const version = ++this._connectionVersion;
    this.setLoadingState('loading');
    this.dispatchEvent(new CustomEvent('flamo-loading'));
    const mountTask = this._lifecycle
      .catch(() => undefined)
      .then(() => {
        if (!this.isConnected || version !== this._connectionVersion) return this;
        return this.mount();
      });
    this.ready = mountTask;
    this._lifecycle = mountTask.catch(() => undefined);
  }

  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent('flamo-disconnected'));
    this._interactionTargets?.destroy();
    this._interactionTargets = null;
    ++this._connectionVersion;
    this._resourceAbort?.abort();
    this.setLoadingState('loading');
    this.ready = null;
    const destroyTask = this._lifecycle
      .catch(() => undefined)
      .then(() => this.destroy({ preserveReady: true }));
    this._lifecycle = destroyTask.catch(() => undefined);
  }

  attributeChangedCallback(name) {
    if (name === 'paused' && this.app) {
      if (this.hasAttribute('paused')) this.app.pause?.();
      else this.app.resume?.();
      return;
    }
    publicBridge.attributeChanged(this, name);
  }

  collectProps() {
    return publicBridge.collect(this);
  }

  connectSlotCollectors() {
    this._slotDisposers.forEach(dispose => dispose());
    this._slotDisposers = [];
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      const listener = () => this.syncSlots();
      slot.addEventListener('slotchange', listener);
      this._slotDisposers.push(() => slot.removeEventListener('slotchange', listener));
    }
  }

  async mount() {
    const version = this._connectionVersion;
    this._resourceAbort = new AbortController();
    try {
      FlamoConfig.setAssetBase(new URL('.', __flamoCdn.runtime).href);
      // Pin CSS size before ECS observes the canvas. Its intrinsic bitmap size
      // must not feed back into CSS layout and grow by DPR on every frame.
      const viewport = this.shadowRoot.querySelector('.viewport');
      this.canvas.style.width = Math.max(1, viewport.clientWidth) + 'px';
      this.canvas.style.height = Math.max(1, viewport.clientHeight) + 'px';
      this._resourcePool ||= createFlamoResourcePool();
      // GPU acquisition and Artifact IO are independent. Reuse this pool's
      // in-flight promise; normal app creation still owns fallback/error handling.
      void this._resourcePool.getGpuResources().catch(() => {});
      registerPackagedAssets(this._resourcePool.imageRegistry);
      const artifact = await createArtifactForMount(this._resourceAbort.signal);
      if (version !== this._connectionVersion || !this.isConnected) return;
      this.runtime ||= createFlamoRuntime({
        canvas: this.canvas,
        resourcePool: this._resourcePool,
        shareApp: true,
        destroySharedAppOnIdle: false,
        // A disconnected Custom Element can reconnect; keep its ECS surface reusable.
        retainSharedCanvasOnIdle: true,
        nodeScriptResolver: resolvePackagedNodeScript,
        appConfig: {
          platform: 'web',
          transparentBackground: true,
          cameraControls: { pan: flamoComponentManifest.viewport.pan, zoom: flamoComponentManifest.viewport.zoom,
            nativeScroll: ['width', 'height'].includes(flamoComponentManifest.viewport.fit) },
          sceneOptions: { expandInstances: false },
          gameLoop: { fixedTimeStep: 1 / 60 },
        },
      });
      // A previous paused mount still owns the retained ECS canvas. Scene loading
      // needs frames before runtime.create resolves; restore paused after loading.
      this._retainedApp?.resume?.();
      let scenePrepared = false;
      const prepareScene = instance => {
        this.instance = instance;
        this.app = instance.app;
        this._retainedApp = this.app;
        publicBridge.flush(this);
        this._disposeViewport?.();
        this._disposeViewport = attachComponentViewport(this, this.app, () => {
          const root = this.instance.resolveNodeId(flamoComponentManifest.packaging.boundaryNodeId);
          return root ? this.app.getNodeProbeSnapshot(root)?.bounds : null;
        }, flamoComponentManifest.viewport);
        this.flamo = instance.createScopedFlamoApi(createFlamoApi(this.app));
        this.connectSlotCollectors();
        this.syncSlots();
        scenePrepared = true;
      };
      const assertConnected = () => {
        if (!this.isConnected || version !== this._connectionVersion) throw new DOMException('Component disconnected', 'AbortError');
      };
      this.instance = await this.runtime.create({
        artifact,
        target: this,
        host: this,
        props: this.collectProps(),
        nodeScriptResolver: resolvePackagedNodeScript,
        deferNodePaintUntilScripts: flamoComponentManifest.startup?.deferredPaintNodeIds ?? [],
        onSceneReady: async instance => {
          assertConnected();
          prepareScene(instance);
          await this.waitForSlotImages();
          await this.app.presentFrame();
          assertConnected();
          this.setLoadingState('static');
          this.dispatchEvent(new CustomEvent('flamo-static-ready', { detail: { manifest: flamoComponentManifest } }));
          // Yield a paint opportunity before the behavior initialization task.
          // A hidden tab must still be able to finish loading without rAF.
          await new Promise(resolve => {
            let frame;
            const signal = this._resourceAbort.signal;
            const finish = () => {
              cancelAnimationFrame(frame);
              document.removeEventListener('visibilitychange', visibility);
              signal.removeEventListener('abort', finish);
              resolve();
            };
            const visibility = () => { if (document.hidden) finish(); };
            if (document.hidden || signal.aborted) { resolve(); return; }
            document.addEventListener('visibilitychange', visibility);
            signal.addEventListener('abort', finish, { once: true });
            frame = requestAnimationFrame(() => { frame = requestAnimationFrame(finish); });
          });
          assertConnected();
          void interactions.preload?.().catch(() => {});
        },
      });
      // Older external Runtime versions do not call onSceneReady.
      if (!scenePrepared) prepareScene(this.instance);
      if (this.hasAttribute('paused')) this.app.pause?.();
      else this.app.resume?.();
      await this.instance.ready;
      publicBridge.flush(this);
      this.syncSlots();
      await this.reloadInteractions();
      await this.waitForSlotImages();
      await this.app.presentFrame();
      if (!this.isConnected || version !== this._connectionVersion) return this;
      this.setLoadingState('ready');
      this._interactionTargets?.destroy();
      this._interactionTargets = createInteractionTargetController(this.instance, flamoComponentManifest.interactionTargets ?? {}, detail => {
        this.dispatchEvent(new CustomEvent('flamo-interaction-targets-change', { detail }));
      });
      this.dispatchEvent(new CustomEvent('flamo-ready', { detail: { app: this.app, instance: this.instance, flamo: this.flamo, manifest: flamoComponentManifest } }));
      return this;
    } catch (error) {
      if (this.isConnected && version === this._connectionVersion) {
        this.setLoadingState('error');
        this.dispatchEvent(new CustomEvent('flamo-error', { detail: { error } }));
      }
      throw error;
    }
  }

  setLoadingState(state) {
    this.setAttribute('data-flamo-state', state);
    this.setAttribute('aria-busy', String(state === 'loading' || state === 'static'));
    this.inert = state !== 'ready';
    this.shadowRoot.querySelector('.viewport').inert = state !== 'ready';
  }

  async waitForSlotImages() {
    // DOM providers may move images into the shadow overlay during a frame.
    const images = new Set([...this.querySelectorAll('img'), ...this.shadowRoot.querySelectorAll('img')]);
    await Promise.all([...images].map(async image => {
      if (!image.complete) await new Promise(resolve => {
        const done = () => { image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
        image.addEventListener('load', done);
        image.addEventListener('error', done);
      });
      if (image.naturalWidth && image.decode) await image.decode().catch(() => undefined);
    }));
  }

  async reloadInteractions() {
    if (!this.flamo) return undefined;
    if (typeof interactions.activateLatest === 'function') return interactions.activateLatest(this.flamo);
    return undefined;
  }

  async destroy({ preserveReady = false } = {}) {
    this.dispatchEvent(new CustomEvent('flamo-destroyed'));
    this._interactionTargets?.destroy();
    this._interactionTargets = null;
    if (!preserveReady) this.setLoadingState('loading');
    this._disposeViewport?.();
    this._disposeViewport = null;
    const runtime = this.runtime;
    const instance = this.instance;
    const app = this.app;
    this._slotDisposers.forEach(dispose => dispose());
    this._slotDisposers = [];
    this.instance = null;
    this.app = null;
    this.flamo = null;
    if (!preserveReady) this.ready = null;
    if (runtime && instance) await runtime.destroy(instance);
    else if (app?.destroy) await app.destroy();
  }

  materializeSlotContent(slot, slotName) {
    const assigned = slot.assignedNodes({ flatten: true }).filter(node => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
    if (assigned.length === 0) {
      return packagingSlots[slotName]?.defaultContent ?? null;
    }
    if (assigned.length === 1 && assigned[0].nodeType === Node.TEXT_NODE) {
      return assigned[0].textContent;
    }
    return assigned.length === 1 ? assigned[0] : assigned;
  }

  applySlotProps(slotName, content) {
    const props = {};
    const slotIR = packagingSlots[slotName] ?? {};
    for (const [name, definition] of Object.entries(slotIR.props ?? {})) {
      if (definition?.from?.kind === 'prop') props[name] = this.instance?.get?.(definition.from.path);
      else if (definition?.from?.kind === 'literal') props[name] = definition.from.value;
      else if (Object.prototype.hasOwnProperty.call(definition ?? {}, 'default')) props[name] = definition.default;
    }
    const nodes = Array.isArray(content) ? content : [content];
    for (const node of nodes) {
      if (!node || typeof node !== 'object' || node.nodeType === Node.TEXT_NODE) continue;
      node.flamoSlotProps = props;
      for (const [name, value] of Object.entries(props)) {
        if (value === null || value === undefined || typeof value === 'object') continue;
        if (node.setAttribute) node.setAttribute('data-' + propToAttribute(name), String(value));
      }
      node.dispatchEvent?.(new CustomEvent('flamo-slot-props-change', {
        bubbles: true,
        composed: true,
        detail: { slot: slotName, props },
      }));
    }
  }

  syncSlots() {
    if (!this.instance) return;
    const assignments = Object.create(null);
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      const name = slot.name || 'default';
      assignments[name] = this.materializeSlotContent(slot, name);
    }
    if (typeof this.instance.mountSlots === 'function') this.instance.mountSlots(assignments);
    else for (const [name, content] of Object.entries(assignments)) this.instance.mountSlot?.(name, content);
    for (const [name, content] of Object.entries(assignments)) this.applySlotProps(name, content);
  }
}

const publicBridge = installComponentPublicSurface(FlamoCoalSystemElement, w3cSurface, publicSurface.parameters ?? {});

export const componentRef = flamoComponentManifest.foundation.componentRef;
export const runtimeAbi = flamoComponentManifest.foundation.ref.runtimeAbi;
export const componentAbi = flamoComponentManifest.foundation.ref.componentAbi;
export const tagName = 'flamo-coal-system';

export function registerFlamoComponent() {
  const existing = customElements.get('flamo-coal-system');
  if (existing && existing !== FlamoCoalSystemElement) {
    throw new Error('Custom Element tag conflict: flamo-coal-system');
  }
  if (!existing) customElements.define('flamo-coal-system', FlamoCoalSystemElement);
}

registerFlamoComponent();

export default FlamoCoalSystemElement;
