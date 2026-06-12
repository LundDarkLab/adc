# Features

This page describes each section of the platform in detail.

## Home and collections

The public home page shows the overall numbers of the instance (institutions, artefacts, models, media) and is the workspace for **collections**:

- **Create** a new collection, give it a title and metadata, and populate it with items from the shared pool.
- **Export** a collection as a JSON file — a portable snapshot of the selection and its metadata.
- **Import** a collection from a previously exported JSON file.

Collections are the "dynamic" part of Dynamic Collections: the same shared pool of items can be recombined into independently curated exhibits.

## Dashboard

The dashboard *(reserved to logged-in users)* is the working hub. It presents filterable lists of:

- **Artefacts** — filter by status (*Under processing* / *Complete*), institution, author, or free-text search on the description.
- **Models** — same filters as artefacts, plus the connection status (*to connect* / *connected*), which highlights models not yet linked to an artefact.
- **Institutions** — filter by category, location or name.
- **Persons** — filter by status (active / disabled / external), user class, institution or name.

Each list has an **add** button for creating new items, and per-row actions to view or edit existing ones (shown according to your permissions).

## Artefacts

The artefact form records the physical object:

| Section | Content |
|---------|---------|
| **Main data** | Inventory number of the original artefact, description, notes |
| **Classification** | Category, category specification, typology, material (from controlled vocabularies) |
| **Chronological definition** | Timeline selection with lower/upper bounds of the dating |
| **Conservation info** | Storage place, conservation state, object condition, weight, "is museum copy" flag |
| **Find site** | Country and sub-national administrative boundaries (provinces, districts, municipalities), parish, toponym, exact coordinates, notes about the position |
| **Metadata** | Author and ownership information |

Artefacts with coordinates automatically appear on the [map](#map); artefacts with a chronological definition appear on the [timeline](#timeline).

## 3D models

A model record is made of three layers of documentation plus the file itself:

1. **Model main data** — name, description, notes, optional **DOI** and citation, so the digital object can be referenced in publications.
2. **Object metadata** — author, owner and license of the digital object.
3. **Object paradata** — *how* the replica was produced: acquisition method (e.g. photogrammetry, laser scanning), software, number of points and polygons, textures, number of scans or pictures.
4. **The 3D file** — uploaded in **Nexus compressed format (`.nxz`)**, the multiresolution format used by the 3DHOP viewer. Multiresolution streaming means even very large models load progressively and remain smooth to interact with.

After the upload the model is rendered immediately in the embedded viewer, where you can frame it and **take a screenshot** that becomes the model's thumbnail.

### The 3D viewer

Artefact and model pages embed the [3DHOP](https://3dhop.net/) viewer (developed by the Visual Computing Lab, ISTI-CNR). Visitors can rotate, pan and zoom the model with the mouse or touch gestures, recenter the view with a double click, and use the toolbar instruments (lighting, measurement and sectioning tools, depending on the model).

## Media

Images, videos, documents and bibliographic references can be attached to artefacts. Each media item records its own credits and license. Videos can also be embedded from external platforms (YouTube, Vimeo) through the External Links area of the artefact.

## Map

The **Map** page shows every geolocated artefact on an interactive [Leaflet](https://leafletjs.com/) map with marker clustering. Clicking a marker opens a preview of the artefact with a link to its page. The find-site information uses hierarchical administrative boundaries (country → province → district → municipality), so positions can be recorded even when only an approximate provenance is known.

## Timeline

The **Timeline** page allows chronological browsing of the collection. Time periods are hierarchical — macro periods, generic periods and specific periods — and each artefact is linked to the most precise level available; the timeline computes the effective start/end of each item from the most specific level defined.

## Vocabularies *(administrators)*

The **Vocabularies** page manages the controlled lists used throughout the platform (materials, typologies, categories, conservation states, licenses, acquisition methods…). Select a vocabulary to see its values and add new ones. Using controlled vocabularies keeps metadata consistent and searchable across contributors and institutions.

## Institutions

Institutions are the owning organisations of items. Administrators can create and edit institutions (name, category, location, logo). Every artefact, model and user belongs to an institution, and Supervisor permissions are scoped to it.

## Users

Administrators (and Supervisors, within their institution) manage user accounts from the dashboard: create a user with name, email and role; the platform emails the credentials to the new user. Users can be deactivated without deleting their contributions.

## Open data

Every published artefact is also available as machine-readable **JSON-LD** mapped to the **CIDOC-CRM** ontology through the public API — see the [developer documentation](../developer/api.md) for details.
