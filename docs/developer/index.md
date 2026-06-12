# Developer Guide — Overview

This guide is for IT staff and developers who need to **install**, **maintain** or **extend** a Dynamic Collections Plus instance.

## The platform at a glance

Dynamic Collections Plus is a classic server-rendered PHP application, packaged as a two-container Docker stack:

- **`web`** — PHP 8.2 + Apache, serving both the pages and the API. Dependencies (PHPMailer, ramsey/uuid) are managed with Composer.
- **`db`** — MySQL 8.4, reachable only from the internal Docker network, with spatial support for the administrative-boundary data used by the find-site forms and the map.

The frontend is vanilla JavaScript (ES modules) with Bootstrap, [Leaflet](https://leafletjs.com/) for maps and [3DHOP](https://3dhop.net/) for the in-browser 3D viewer. There is no JS build step: the files are served as they are.

Uploaded content (3D models, images, documents) lives on the host filesystem in `archive/`, mounted into the web container; the database lives in a named Docker volume. See [Architecture](architecture.md) for the full picture.

## Where to go next

| You want to… | Read |
|--------------|------|
| Check what you need before installing | [Requirements](requirements.md) |
| Install the platform | [Installation](installation.md) |
| Understand how the pieces fit together | [Architecture](architecture.md) |
| Integrate with the data (JSON-LD / CIDOC-CRM) | [API](api.md) |
| Back up, update, troubleshoot | [Maintenance](maintenance.md) |
| Know the licensing terms | [About](about.md) |

## Source code

The code is hosted on GitHub: [github.com/LundDarkLab/adc](https://github.com/LundDarkLab/adc). Bug reports and contributions are welcome through GitHub issues and pull requests.
