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
  "projectId": "1427321c-8f2b-43cf-999a-75f4c55eed89",
  "tagName": "flamo-jianpan",
  "className": "FlamoJianpanElement",
  "packageName": "@flamo-components/flamo-jianpan",
  "name": "jianpan",
  "generatedAt": "2026-11-17T08:50:43.269Z",
  "source": {
    "kind": "local-fig",
    "id": "4c3b0dd1-c0ee-4144-b0b6-c9d0a9333b2e",
    "name": "监盘"
  },
  "entry": "dist/flamo-jianpan.js",
  "types": "dist/flamo-jianpan.d.ts",
  "surface": {
    "componentPropertiesVersion": "1.0",
    "parameters": {
      "ltzq1Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组汽1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzs1Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组水1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzs2zShow": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组水2_左”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzs2yShow": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组水2_右”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzs3Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组水3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzs4Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组水4”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzf1Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组风1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzf2Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组风2”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzf3Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组风3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzf4Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组风4”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzy1Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组烟1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzy2Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组烟2”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      },
      "ltzy3Show": {
        "type": "boolean",
        "schema": {
          "type": "boolean"
        },
        "default": true,
        "validation": "strict",
        "description": "控制“流体组烟3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
        "persistence": "artifact"
      }
    },
    "slots": {
      "cZFXT": {
        "name": "CZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:98",
        "outlets": [
          {
            "outletId": "cZFXT:38%3A98",
            "target": "38:98"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:1",
          "name": "CZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "bZFXT": {
        "name": "BZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:97",
        "outlets": [
          {
            "outletId": "bZFXT:38%3A97",
            "target": "38:97"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:2",
          "name": "BZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "fZFXT": {
        "name": "FZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:96",
        "outlets": [
          {
            "outletId": "fZFXT:38%3A96",
            "target": "38:96"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:3",
          "name": "FZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "eZFXT": {
        "name": "EZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:95",
        "outlets": [
          {
            "outletId": "eZFXT:38%3A95",
            "target": "38:95"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:4",
          "name": "EZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "dZFXT": {
        "name": "DZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:94",
        "outlets": [
          {
            "outletId": "dZFXT:38%3A94",
            "target": "38:94"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:5",
          "name": "DZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "aZFXT": {
        "name": "AZFXT",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:93",
        "outlets": [
          {
            "outletId": "aZFXT:38%3A93",
            "target": "38:93"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:6",
          "name": "AZFXT",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "bYCFJ": {
        "name": "BYCFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:101",
        "outlets": [
          {
            "outletId": "bYCFJ:38%3A101",
            "target": "38:101"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:7",
          "name": "BYCFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "bSFJ": {
        "name": "BSFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:100",
        "outlets": [
          {
            "outletId": "bSFJ:38%3A100",
            "target": "38:100"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:8",
          "name": "BSFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "bYFJ": {
        "name": "BYFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:99",
        "outlets": [
          {
            "outletId": "bYFJ:38%3A99",
            "target": "38:99"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:9",
          "name": "BYFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "aYFJ": {
        "name": "AYFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:92",
        "outlets": [
          {
            "outletId": "aYFJ:38%3A92",
            "target": "38:92"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:10",
          "name": "AYFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "aSFJ": {
        "name": "ASFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:91",
        "outlets": [
          {
            "outletId": "aSFJ:38%3A91",
            "target": "38:91"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:11",
          "name": "ASFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "bNB": {
        "name": "BNB",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:90",
        "outlets": [
          {
            "outletId": "bNB:38%3A90",
            "target": "38:90"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:12",
          "name": "BNB",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "aNB": {
        "name": "ANB",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:89",
        "outlets": [
          {
            "outletId": "aNB:38%3A89",
            "target": "38:89"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:13",
          "name": "ANB",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "lTDHHY": {
        "name": "LTDHHY",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:88",
        "outlets": [
          {
            "outletId": "lTDHHY:38%3A88",
            "target": "38:88"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:14",
          "name": "LTDHHY",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "lTDHYW": {
        "name": "LTDHYW",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:87",
        "outlets": [
          {
            "outletId": "lTDHYW:38%3A87",
            "target": "38:87"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:15",
          "name": "LTDHYW",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "gSB": {
        "name": "GSB",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:86",
        "outlets": [
          {
            "outletId": "gSB:38%3A86",
            "target": "38:86"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:16",
          "name": "GSB",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      },
      "aYCFJ": {
        "name": "AYCFJ",
        "accepts": [
          "artifact",
          "flamoInstance",
          "dom",
          "html",
          "text"
        ],
        "target": "38:85",
        "outlets": [
          {
            "outletId": "aYCFJ:38%3A85",
            "target": "38:85"
          }
        ],
        "source": "figma",
        "figma": {
          "id": "39:17",
          "name": "AYCFJ",
          "type": "SLOT",
          "nodeId": "39:103",
          "projection": "native",
          "bindingProjection": "native"
        }
      }
    }
  },
  "resources": [],
  "scripts": [
    {
      "id": "jianpan2-visibility",
      "src": "src/nodes/39_103/script.ts",
      "compiled": ".flamo/generated/interactions/revisions/7a25e2762a2d6a678558/scripts/jianpan2-visibility/register.js",
      "kind": "composition",
      "language": "ts",
      "behaviorRef": "jianpan2.visibility",
      "version": "1.0.0"
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
    }
  ],
  "slots": {
    "CZFXT": {
      "name": "CZFXT",
      "required": false,
      "target": "38:98",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "BZFXT": {
      "name": "BZFXT",
      "required": false,
      "target": "38:97",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "FZFXT": {
      "name": "FZFXT",
      "required": false,
      "target": "38:96",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "EZFXT": {
      "name": "EZFXT",
      "required": false,
      "target": "38:95",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "DZFXT": {
      "name": "DZFXT",
      "required": false,
      "target": "38:94",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "AZFXT": {
      "name": "AZFXT",
      "required": false,
      "target": "38:93",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "BYCFJ": {
      "name": "BYCFJ",
      "required": false,
      "target": "38:101",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "BSFJ": {
      "name": "BSFJ",
      "required": false,
      "target": "38:100",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "BYFJ": {
      "name": "BYFJ",
      "required": false,
      "target": "38:99",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "AYFJ": {
      "name": "AYFJ",
      "required": false,
      "target": "38:92",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "ASFJ": {
      "name": "ASFJ",
      "required": false,
      "target": "38:91",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "BNB": {
      "name": "BNB",
      "required": false,
      "target": "38:90",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "ANB": {
      "name": "ANB",
      "required": false,
      "target": "38:89",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "LTDHHY": {
      "name": "LTDHHY",
      "required": false,
      "target": "38:88",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "LTDHYW": {
      "name": "LTDHYW",
      "required": false,
      "target": "38:87",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "GSB": {
      "name": "GSB",
      "required": false,
      "target": "38:86",
      "accepts": [
        "artifact",
        "flamoInstance",
        "dom",
        "html",
        "text"
      ]
    },
    "AYCFJ": {
      "name": "AYCFJ",
      "required": false,
      "target": "38:85",
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
      "94:8",
      "94:5",
      "110:3",
      "96:108",
      "96:105",
      "110:15",
      "96:114",
      "96:112",
      "110:13",
      "96:17",
      "96:14",
      "110:5",
      "96:165",
      "96:162",
      "110:16",
      "96:171",
      "96:169",
      "110:17",
      "96:184",
      "96:182",
      "110:18",
      "96:203",
      "96:201",
      "110:19",
      "96:218",
      "96:215",
      "110:20",
      "96:224",
      "96:222",
      "110:21",
      "96:240",
      "96:238",
      "110:24",
      "96:27",
      "96:24",
      "110:4",
      "96:255",
      "96:253",
      "110:22",
      "96:278",
      "96:276",
      "110:25",
      "96:290",
      "96:288",
      "110:23",
      "96:305",
      "96:303",
      "110:26",
      "96:33",
      "96:30",
      "110:2",
      "96:329",
      "96:327",
      "96:428",
      "96:41",
      "96:38",
      "110:6",
      "96:432",
      "96:430",
      "110:10",
      "96:49",
      "96:46",
      "110:7",
      "96:57",
      "96:54",
      "110:9",
      "96:66",
      "96:63",
      "110:8",
      "96:85",
      "96:82",
      "110:11",
      "96:93",
      "96:90",
      "110:12",
      "96:101",
      "96:98",
      "110:14"
    ]
  },
  "documentation": {
    "schemaVersion": 1,
    "interactions": "interactions.json",
    "guide": "INTERACTIONS.md",
    "api": "INTERACTION_API.md",
    "integrity": "sha256:25fdeefb17f26e382d86f224550cd53410c3b26d24390f9dd529082d9c25b0c1"
  },
  "integration": {
    "projectId": "1427321c-8f2b-43cf-999a-75f4c55eed89",
    "contractId": "sha256:4578dfa3af69cf2a340c84f86649545f6990feeaa59c7e80b6814d1efb992168",
    "artifactRevision": "local-7a25e2762a2d6a678558"
  },
  "interactionTargets": {
    "target-7eb2037bc9c46c9d": {
      "runtimeRef": "39:103"
    }
  },
  "assets": [
    {
      "hash": "2955846a2b879500c2c2c92385f48280d5d4fbe5",
      "path": "dist/assets/images/2955846a2b879500c2c2c92385f48280d5d4fbe5.png"
    },
    {
      "hash": "fecc0cf4a15b1017e57a3a5b7cae56283550b304",
      "path": "dist/assets/images/fecc0cf4a15b1017e57a3a5b7cae56283550b304.png"
    },
    {
      "hash": "8c760352c23eeb30365a03cf15a27b2de07eef6e",
      "path": "dist/assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e"
    }
  ],
  "compiledResources": {
    "schema": "flamo.resources/2",
    "manifest": "dist/resources/artifact.json",
    "integrity": "sha256:f9141c3f40c383c8b47366560a37ee492d7a3f500978b1a10ae160b927ea36c8",
    "report": {
      "compiler": "flamo.runtime-resources/1",
      "revision": "local-7a25e2762a2d6a678558",
      "manifestBytes": 382890,
      "binaryBytes": 63108,
      "blocks": 173,
      "references": 269,
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
    "boundaryNodeId": "39:103",
    "sourceArtifact": "view/data/artifact.flamo.json",
    "artifactRevision": "local-7a25e2762a2d6a678558"
  },
  "contract": {
    "components": [
      {
        "id": "Jianpan2",
        "name": "jianpan",
        "rootNodeId": "39:103",
        "exportName": "Jianpan2",
        "tagName": "flamo-jianpan2",
        "roles": {
          "root": "39:103",
          "ltzq1Show": "96:438",
          "ltzs1Show": "96:39",
          "ltzs2zShow": "96:439",
          "ltzs2yShow": "96:440",
          "ltzs3Show": "96:441",
          "ltzs4Show": "96:442",
          "ltzf1Show": "96:163",
          "ltzf2Show": "96:168",
          "ltzf3Show": "96:181",
          "ltzf4Show": "96:200",
          "ltzy1Show": "96:216",
          "ltzy2Show": "96:443",
          "ltzy3Show": "96:444"
        },
        "controlSurface": {
          "props": {
            "ltzq1Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组汽1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzs1Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组水1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzs2zShow": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组水2_左”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzs2yShow": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组水2_右”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzs3Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组水3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzs4Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组水4”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzf1Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组风1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzf2Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组风2”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzf3Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组风3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzf4Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组风4”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzy1Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组烟1”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzy2Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组烟2”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            },
            "ltzy3Show": {
              "type": "boolean",
              "schema": {
                "type": "boolean"
              },
              "default": true,
              "validation": "strict",
              "description": "控制“流体组烟3”节点的显示隐藏，true 显示，false 隐藏。注释未指定默认值；默认 true 保持原节点可见。",
              "persistence": "artifact"
            }
          },
          "slots": {
            "cZFXT": {
              "name": "CZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:98",
              "outlets": [
                {
                  "outletId": "cZFXT:38%3A98",
                  "target": "38:98"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:1",
                "name": "CZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "bZFXT": {
              "name": "BZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:97",
              "outlets": [
                {
                  "outletId": "bZFXT:38%3A97",
                  "target": "38:97"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:2",
                "name": "BZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "fZFXT": {
              "name": "FZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:96",
              "outlets": [
                {
                  "outletId": "fZFXT:38%3A96",
                  "target": "38:96"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:3",
                "name": "FZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "eZFXT": {
              "name": "EZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:95",
              "outlets": [
                {
                  "outletId": "eZFXT:38%3A95",
                  "target": "38:95"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:4",
                "name": "EZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "dZFXT": {
              "name": "DZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:94",
              "outlets": [
                {
                  "outletId": "dZFXT:38%3A94",
                  "target": "38:94"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:5",
                "name": "DZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "aZFXT": {
              "name": "AZFXT",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:93",
              "outlets": [
                {
                  "outletId": "aZFXT:38%3A93",
                  "target": "38:93"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:6",
                "name": "AZFXT",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "bYCFJ": {
              "name": "BYCFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:101",
              "outlets": [
                {
                  "outletId": "bYCFJ:38%3A101",
                  "target": "38:101"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:7",
                "name": "BYCFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "bSFJ": {
              "name": "BSFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:100",
              "outlets": [
                {
                  "outletId": "bSFJ:38%3A100",
                  "target": "38:100"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:8",
                "name": "BSFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "bYFJ": {
              "name": "BYFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:99",
              "outlets": [
                {
                  "outletId": "bYFJ:38%3A99",
                  "target": "38:99"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:9",
                "name": "BYFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "aYFJ": {
              "name": "AYFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:92",
              "outlets": [
                {
                  "outletId": "aYFJ:38%3A92",
                  "target": "38:92"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:10",
                "name": "AYFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "aSFJ": {
              "name": "ASFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:91",
              "outlets": [
                {
                  "outletId": "aSFJ:38%3A91",
                  "target": "38:91"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:11",
                "name": "ASFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "bNB": {
              "name": "BNB",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:90",
              "outlets": [
                {
                  "outletId": "bNB:38%3A90",
                  "target": "38:90"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:12",
                "name": "BNB",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "aNB": {
              "name": "ANB",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:89",
              "outlets": [
                {
                  "outletId": "aNB:38%3A89",
                  "target": "38:89"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:13",
                "name": "ANB",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "lTDHHY": {
              "name": "LTDHHY",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:88",
              "outlets": [
                {
                  "outletId": "lTDHHY:38%3A88",
                  "target": "38:88"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:14",
                "name": "LTDHHY",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "lTDHYW": {
              "name": "LTDHYW",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:87",
              "outlets": [
                {
                  "outletId": "lTDHYW:38%3A87",
                  "target": "38:87"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:15",
                "name": "LTDHYW",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "gSB": {
              "name": "GSB",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:86",
              "outlets": [
                {
                  "outletId": "gSB:38%3A86",
                  "target": "38:86"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:16",
                "name": "GSB",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            },
            "aYCFJ": {
              "name": "AYCFJ",
              "accepts": [
                "artifact",
                "flamoInstance",
                "dom",
                "html",
                "text"
              ],
              "target": "38:85",
              "outlets": [
                {
                  "outletId": "aYCFJ:38%3A85",
                  "target": "38:85"
                }
              ],
              "source": "figma",
              "figma": {
                "id": "39:17",
                "name": "AYCFJ",
                "type": "SLOT",
                "nodeId": "39:103",
                "projection": "native",
                "bindingProjection": "native"
              }
            }
          }
        },
        "scripts": [
          {
            "id": "jianpan2-visibility",
            "src": "src/nodes/39_103/script.ts",
            "compiled": ".flamo/generated/interactions/scripts/jianpan2-visibility/register.js",
            "kind": "composition",
            "language": "ts",
            "behaviorRef": "jianpan2.visibility",
            "version": "1.0.0"
          }
        ],
        "provenance": {
          "source": "annotation-83196c71c9844925",
          "artifact": "view/data/artifact.flamo.json"
        }
      }
    ],
    "bindings": [
      {
        "id": "Jianpan2.ltzq1Show",
        "componentId": "Jianpan2",
        "nodeId": "96:438",
        "kind": "prop-to-node",
        "from": "props.ltzq1Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzq1Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzs1Show",
        "componentId": "Jianpan2",
        "nodeId": "96:39",
        "kind": "prop-to-node",
        "from": "props.ltzs1Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzs1Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzs2zShow",
        "componentId": "Jianpan2",
        "nodeId": "96:439",
        "kind": "prop-to-node",
        "from": "props.ltzs2zShow",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzs2zShow",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzs2yShow",
        "componentId": "Jianpan2",
        "nodeId": "96:440",
        "kind": "prop-to-node",
        "from": "props.ltzs2yShow",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzs2yShow",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzs3Show",
        "componentId": "Jianpan2",
        "nodeId": "96:441",
        "kind": "prop-to-node",
        "from": "props.ltzs3Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzs3Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzs4Show",
        "componentId": "Jianpan2",
        "nodeId": "96:442",
        "kind": "prop-to-node",
        "from": "props.ltzs4Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzs4Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzf1Show",
        "componentId": "Jianpan2",
        "nodeId": "96:163",
        "kind": "prop-to-node",
        "from": "props.ltzf1Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzf1Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzf2Show",
        "componentId": "Jianpan2",
        "nodeId": "96:168",
        "kind": "prop-to-node",
        "from": "props.ltzf2Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzf2Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzf3Show",
        "componentId": "Jianpan2",
        "nodeId": "96:181",
        "kind": "prop-to-node",
        "from": "props.ltzf3Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzf3Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzf4Show",
        "componentId": "Jianpan2",
        "nodeId": "96:200",
        "kind": "prop-to-node",
        "from": "props.ltzf4Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzf4Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzy1Show",
        "componentId": "Jianpan2",
        "nodeId": "96:216",
        "kind": "prop-to-node",
        "from": "props.ltzy1Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzy1Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzy2Show",
        "componentId": "Jianpan2",
        "nodeId": "96:443",
        "kind": "prop-to-node",
        "from": "props.ltzy2Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzy2Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      },
      {
        "id": "Jianpan2.ltzy3Show",
        "componentId": "Jianpan2",
        "nodeId": "96:444",
        "kind": "prop-to-node",
        "from": "props.ltzy3Show",
        "to": "NodeCpt.visible",
        "script": "src/nodes/39_103/script.ts",
        "behaviorRef": "jianpan2.visibility",
        "version": "1.0.0",
        "role": "ltzy3Show",
        "cleanup": "dispose watcher; restore captured visibility",
        "verification": ".flamo/reports/jianpan2-verification.json"
      }
    ]
  },
  "ai": {
    "entry": "AGENTS.md",
    "usage": "README.md",
    "typeHints": "dist/flamo-jianpan.d.ts"
  },
  "foundation": {
    "ref": {
      "schemaVersion": 1,
      "namespace": "project.1427321c-8f2b-43cf-999a-75f4c55eed89",
      "id": "component-flamo-jianpan",
      "version": "0.1.0",
      "exportName": "Jianpan",
      "artifactRevision": "local-7a25e2762a2d6a678558",
      "artifactHash": "sha256:3e0ac8aaf119df9fc12615025598bf2a6e67ff5133cd7ef804f0fb315862b3fd",
      "runtimeAbi": "runtime-v1",
      "componentAbi": "sha256:9ef07e6ff3f052a2f165bc036eb832f46b459455a72145ddd2c8b0f7930fd670"
    },
    "componentRef": "flamo://components/project.1427321c-8f2b-43cf-999a-75f4c55eed89/component-flamo-jianpan@0.1.0#Jianpan",
    "surfaceHash": "sha256:9ef07e6ff3f052a2f165bc036eb832f46b459455a72145ddd2c8b0f7930fd670",
    "compositionHash": "sha256:ee3c7dd81fc85e35f971a59c6b0931f7e950223ea7ccdd5a561e404b6e13409a",
    "runtimeAbi": "runtime-v1",
    "componentAbi": "sha256:9ef07e6ff3f052a2f165bc036eb832f46b459455a72145ddd2c8b0f7930fd670"
  },
  "distribution": {
    "loader": "dist/flamo-jianpan.loader.js",
    "loadingStyles": "dist/component-loading.css"
  }
};
const imageAssets = [{"hash":"2955846a2b879500c2c2c92385f48280d5d4fbe5","path":".flamo/imports/assets/images/2955846a2b879500c2c2c92385f48280d5d4fbe5.png","packagedPath":"assets/images/2955846a2b879500c2c2c92385f48280d5d4fbe5.png"},{"hash":"fecc0cf4a15b1017e57a3a5b7cae56283550b304","path":".flamo/imports/assets/images/fecc0cf4a15b1017e57a3a5b7cae56283550b304.png","packagedPath":"assets/images/fecc0cf4a15b1017e57a3a5b7cae56283550b304.png"},{"hash":"8c760352c23eeb30365a03cf15a27b2de07eef6e","path":".flamo/imports/assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e","packagedPath":"assets/images/8c760352c23eeb30365a03cf15a27b2de07eef6e"}];
const publicSurface = flamoComponentManifest.surface ?? {};
const w3cSurface = {"properties":[{"name":"ltzq1Show","type":"boolean","required":false,"attribute":"ltzq1-show","default":true},{"name":"ltzs1Show","type":"boolean","required":false,"attribute":"ltzs1-show","default":true},{"name":"ltzs2zShow","type":"boolean","required":false,"attribute":"ltzs2z-show","default":true},{"name":"ltzs2yShow","type":"boolean","required":false,"attribute":"ltzs2y-show","default":true},{"name":"ltzs3Show","type":"boolean","required":false,"attribute":"ltzs3-show","default":true},{"name":"ltzs4Show","type":"boolean","required":false,"attribute":"ltzs4-show","default":true},{"name":"ltzf1Show","type":"boolean","required":false,"attribute":"ltzf1-show","default":true},{"name":"ltzf2Show","type":"boolean","required":false,"attribute":"ltzf2-show","default":true},{"name":"ltzf3Show","type":"boolean","required":false,"attribute":"ltzf3-show","default":true},{"name":"ltzf4Show","type":"boolean","required":false,"attribute":"ltzf4-show","default":true},{"name":"ltzy1Show","type":"boolean","required":false,"attribute":"ltzy1-show","default":true},{"name":"ltzy2Show","type":"boolean","required":false,"attribute":"ltzy2-show","default":true},{"name":"ltzy3Show","type":"boolean","required":false,"attribute":"ltzy3-show","default":true}],"attributes":[{"name":"ltzq1-show","property":"ltzq1Show","type":"boolean","default":true},{"name":"ltzs1-show","property":"ltzs1Show","type":"boolean","default":true},{"name":"ltzs2z-show","property":"ltzs2zShow","type":"boolean","default":true},{"name":"ltzs2y-show","property":"ltzs2yShow","type":"boolean","default":true},{"name":"ltzs3-show","property":"ltzs3Show","type":"boolean","default":true},{"name":"ltzs4-show","property":"ltzs4Show","type":"boolean","default":true},{"name":"ltzf1-show","property":"ltzf1Show","type":"boolean","default":true},{"name":"ltzf2-show","property":"ltzf2Show","type":"boolean","default":true},{"name":"ltzf3-show","property":"ltzf3Show","type":"boolean","default":true},{"name":"ltzf4-show","property":"ltzf4Show","type":"boolean","default":true},{"name":"ltzy1-show","property":"ltzy1Show","type":"boolean","default":true},{"name":"ltzy2-show","property":"ltzy2Show","type":"boolean","default":true},{"name":"ltzy3-show","property":"ltzy3Show","type":"boolean","default":true}],"events":[],"methods":[],"slots":[{"name":"CZFXT"},{"name":"BZFXT"},{"name":"FZFXT"},{"name":"EZFXT"},{"name":"DZFXT"},{"name":"AZFXT"},{"name":"BYCFJ"},{"name":"BSFJ"},{"name":"BYFJ"},{"name":"AYFJ"},{"name":"ASFJ"},{"name":"BNB"},{"name":"ANB"},{"name":"LTDHHY"},{"name":"LTDHYW"},{"name":"GSB"},{"name":"AYCFJ"}]};
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
  const artifactData = await loadPackagedArtifact(import.meta.url, "f9141c3f40c383c8b47366560a37ee492d7a3f500978b1a10ae160b927ea36c8", signal);
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

export class FlamoJianpanElement extends HTMLElement {
  static get observedAttributes() {
    return ['paused', ...w3cSurface.attributes.map(attribute => attribute.name)];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<style>:host{display:block;position:relative;width:300px;height:150px;contain:content}.viewport{position:absolute;inset:0;overflow:hidden;opacity:0}:host([data-flamo-state="ready"]) .viewport,:host([data-flamo-state="static"]) .viewport{opacity:1}.canvas-layer{position:sticky;top:0;left:0;width:100%;height:0;z-index:1}canvas{display:block;position:absolute;top:0;left:0}.extent{pointer-events:none}.slot-collector{display:none}</style><div class="viewport" part="viewport" inert><div class="canvas-layer"><canvas part="canvas" tabindex="0"></canvas></div><div class="extent"></div></div><div class="slot-collector"><slot name="CZFXT"></slot><slot name="BZFXT"></slot><slot name="FZFXT"></slot><slot name="EZFXT"></slot><slot name="DZFXT"></slot><slot name="AZFXT"></slot><slot name="BYCFJ"></slot><slot name="BSFJ"></slot><slot name="BYFJ"></slot><slot name="AYFJ"></slot><slot name="ASFJ"></slot><slot name="BNB"></slot><slot name="ANB"></slot><slot name="LTDHHY"></slot><slot name="LTDHYW"></slot><slot name="GSB"></slot><slot name="AYCFJ"></slot><slot></slot></div>';
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

const publicBridge = installComponentPublicSurface(FlamoJianpanElement, w3cSurface, publicSurface.parameters ?? {});

export const componentRef = flamoComponentManifest.foundation.componentRef;
export const runtimeAbi = flamoComponentManifest.foundation.ref.runtimeAbi;
export const componentAbi = flamoComponentManifest.foundation.ref.componentAbi;
export const tagName = 'flamo-jianpan';

export function registerFlamoComponent() {
  const existing = customElements.get('flamo-jianpan');
  if (existing && existing !== FlamoJianpanElement) {
    throw new Error('Custom Element tag conflict: flamo-jianpan');
  }
  if (!existing) customElements.define('flamo-jianpan', FlamoJianpanElement);
}

registerFlamoComponent();

export default FlamoJianpanElement;
