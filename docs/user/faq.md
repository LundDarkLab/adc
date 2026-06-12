# Frequently asked questions

### I did not receive the email with my credentials. What should I do?

Check your spam folder first. If nothing arrived, ask the Administrator or the Supervisor of your institution to verify your email address and resend the credentials.

### I forgot my password.

Use the password-reset link on the login page: enter your email address and follow the instructions you receive by email.

### Why can't I edit a certain artefact or model?

Editing rights depend on your role: **Authors** can edit the items they created, **Supervisors** every item of their own institution, **Administrators** everything. If the edit button is missing, the item belongs to another author or institution.

### What file format do 3D models need?

The viewer uses the **Nexus** multiresolution format: upload files in compressed Nexus format (**`.nxz`**). Models in common formats (PLY, OBJ…) must first be converted with the free [Nexus tools](https://github.com/cnr-isti-vclab/nexus) (`nxsbuild` + `nxscompress`) provided by the Visual Computing Lab, ISTI-CNR.

### How big can a 3D model be?

Thanks to the multiresolution format there is no practical limit for visualisation — the model streams progressively. Mind, however, that very large files take longer to upload and consume server disk space; ask the administrator of your instance about local size policies.

### What is the difference between metadata and paradata?

**Metadata** describe the object (author, owner, license, description). **Paradata** document the *process* that produced the digital object: acquisition technique, software, number of points/polygons, textures, scans and pictures used. Both are first-class citizens in the platform, because a digital replica is only as trustworthy as the documentation of how it was made.

### Which licenses can I assign to content?

Content licensing uses open licenses: **CC BY**, **CC0** and **Public Domain**. Each model and media item carries its own license, shown in its metadata.

### Can I cite a model in a publication?

Yes. Models can carry a **DOI** and a citation string in their main data. The artefact and model pages are stable URLs and the metadata are exposed as machine-readable JSON-LD (CIDOC-CRM) through the public API.

### What does "Under processing" mean?

New artefacts and models start in the *Under processing* state, meaning the record is still being worked on. Mark an item *Complete* when its documentation is ready. The dashboard filters items by this status, so unfinished records are easy to find.

### What does "to connect" mean for a model?

A model that has been uploaded but not yet linked to an artefact. The dashboard model list has a dedicated filter to find them; open the model and connect it to the corresponding artefact.

### Can I use the platform from a phone or tablet?

Yes, the interface adapts to mobile devices. For data entry and 3D model inspection a desktop browser is recommended.

### Who do I contact for problems?

For account or content issues, the Administrator of your instance. For bugs and feature requests, open an issue on the [GitHub repository](https://github.com/LundDarkLab/adc).
