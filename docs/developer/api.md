# API

The platform exposes two HTTP APIs with very different purposes:

| | Public JSON-LD API | Internal API |
|---|---|---|
| **File** | `api/endpoint.php` | `api/endpoint_private.php` |
| **Audience** | External consumers, aggregators, researchers | The platform's own frontend |
| **Access** | Public, read-only | Session-based |
| **Format** | JSON-LD (CIDOC-CRM) | JSON (RPC-style) |

## Public JSON-LD API

Published artefacts are available as machine-readable **JSON-LD** mapped to the [CIDOC Conceptual Reference Model](https://www.cidoc-crm.org/), the ISO standard ontology for cultural heritage documentation.

The endpoint is served under `api/endpoint/` (an Apache rewrite maps the clean URL to `endpoint.php`):

### Get all objects

```
GET /api/endpoint/objects
Content-Type: application/ld+json
```

Returns the full list of published artefacts as a JSON-LD graph.

### Get a single object

```
GET /api/endpoint/object?id=<numeric id>
Content-Type: application/ld+json
```

Returns one artefact. Responds `400` if `id` is missing, `404` for unknown paths.

### Mapping

Each object exposes, among others: identifier, class and specific class (`crm:P2_has_type`), materials, chronology, find place and the links to its digital representations. The `@context` block in every response documents the full term mapping.

## Internal API

The frontend communicates with the backend through a single RPC-style endpoint. **This API is not a stable public contract** — it can change between versions without notice; external integrations should use the JSON-LD API instead. It is documented here for contributors.

### Request

```
POST /api/endpoint_private.php
Content-Type: application/json
```

```json
{
  "class": "Artifact",
  "action": "getList",
  "status": 1
}
```

- `class` — one of the exposed `Adc\` classes: `Artifact`, `Collection`, `File`, `Geom`, `Get`, `Institution`, `Model`, `Media`, `Person`, `Stats`, `Timeline`, `User`, `Vocabulary`.
- `action` — a public method of that class.
- Every other property is passed to the method as its parameter array. File uploads use `multipart/form-data` with the same `class`/`action` fields; the files are passed as the method's second argument.

### Response

```json
{ "error": 0, "data": { } }
```

| HTTP status | Meaning |
|-------------|---------|
| `200` | OK — `data` holds the result |
| `400` | `class` or `action` missing |
| `404` | Unknown class or method |
| `405` | Method other than POST |
| `500` | Application error — `message` holds the reason |

### Adding an endpoint

To expose a new operation, add a public method to the relevant class in `api/src/` (or add the class to the `$availableClasses` whitelist in `endpoint_private.php`). The dispatcher inspects the method signature: one parameter receives the input array, two parameters receive input and `$_FILES`.
