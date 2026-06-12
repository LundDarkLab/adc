# Getting started

## Your account

Accounts are created by an Administrator or a Supervisor of your institution. When your account is created you receive an **email** with your credentials. If you have not received it, check your spam folder, then contact the person who manages users at your institution.

### Logging in

1. Open the platform in your browser and click **login** in the menu.
2. Enter your email address and password.
3. After logging in you land on the home page; the side menu now shows the reserved sections (dashboard, add artefact, add model…).

### Forgot your password?

Use the **password reset** link on the login page: enter your email address and you will receive a message with instructions to set a new password.

### Your profile

From **Settings** you can change your password and update your profile data at any time.

## A tour of the interface

- **Home** — the public landing page: live counters (institutions, artefacts, models, media), the galleries, and your personal **collection** workspace.
- **Dashboard** *(reserved)* — your working hub: filterable lists of artefacts, models, institutions and persons, each with quick actions to add or edit items.
- **Map** — all geolocated artefacts on an interactive map, with marker clustering.
- **Timeline** — chronological browsing through hierarchical time periods.
- **db model** — a reference diagram of the database structure.

## Your first artefact, step by step

!!! note "Administrators first"
    On a fresh installation some vocabularies are intentionally empty, because they depend on the scientific scope of each institution. Before the first artefact can be recorded, an administrator must fill the **artefact categories** (*Category class* and *Category specification*, from the **Vocabularies** page) and create at least one **timeline** with its macro/generic/specific periods (from the **Timeline** page). The other vocabularies (materials, conservation states, licenses…) come pre-filled and can be extended at any time.

The typical documentation workflow goes from the physical object to its digital representations:

### 1. Record the artefact

From the dashboard (or the side menu) choose **Add new artifact** and fill in the form:

- **Main data** — the inventory number of the original artefact and its description. Keep the description focused on the object itself; interactive content (embedded videos, references, images) goes in the External Links area.
- **Category, typology, material** — choose from the controlled vocabularies.
- **Chronological definition** — select a timeline and the lower/upper bounds of the dating.
- **Conservation info** — storage place, conservation state, object condition, weight.
- **Find site** — the provenance of the object: country and administrative subdivisions, parish, toponym, or exact coordinates (longitude/latitude). Geolocated artefacts appear on the map.

Save the artefact. New items start in the **Under processing** state and can be refined over time; mark them **Complete** when the record is ready.

### 2. Add a 3D model

Choose **Add new model** and:

1. Fill in the **model main data**: name, description, optional DOI and citation.
2. Fill in the **object metadata** (author, owner, license) and the **paradata** (acquisition method, software, points, polygons, textures, scans, pictures) — this documents how the digital replica was produced.
3. **Upload** the model file in Nexus compressed format (`.nxz`). The model is displayed in the embedded viewer right after the upload.
4. Use **Take a screenshot** to generate the model thumbnail.
5. Save, then **connect** the model to its artefact (the dashboard shows which models are still *to connect*).

### 3. Attach media

From the artefact page, add images, videos, documents and bibliographic references with the **Add media** form. Each media item carries its own license and credits.

### 4. Build a collection

From the home page, create a new collection and add items from the shared pool. Collections can be **exported as JSON** files and **imported** back — useful for sharing a curated selection or moving it between instances.

Next: explore the platform section by section in [Features](features.md).
