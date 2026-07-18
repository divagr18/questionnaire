# Proposal: Offline Event Questionnaire Intranet

**Prepared:** 18 July 2026  
**Deployment model:** Laptop-hosted, fully local network  
**Baseline capacity:** 100–150 simultaneously connected attendees  
**Recommended wireless design:** Two wired business-grade access points  

## 1. Executive summary

This proposal describes a portable, internet-independent questionnaire system for events. A laptop in the venue will host the website, application server, SQLite database, administrative dashboard, and local backups. Attendees will join a dedicated event Wi-Fi network and open a mobile-friendly form by scanning a QR code.

The event system will not depend on public internet access, cloud hosting, remote authentication, external DNS, CDNs, analytics, or third-party APIs. All application assets and data will remain on equipment located in the room.

The recommended design separates the application server from the wireless network:

- The laptop runs the application and stores the data.
- A dedicated router provides DHCP, local DNS, firewalling, and network management.
- Two wired business-grade access points provide attendee Wi-Fi.
- The laptop is connected to the network by Gigabit Ethernet, not Wi-Fi.
- A UPS powers the router, switch, and access points; the laptop battery provides additional server resilience.

For a lightweight questionnaire, laptop processing power and Ethernet bandwidth are not expected to be constraints. Wireless client association, radio interference, power continuity, and operational testing are the primary reliability considerations.

## 2. Objectives

The system will:

1. Operate with no internet connection during the event.
2. Support 100–150 attendees connected at approximately the same time.
3. Present a responsive form on common Android and iPhone browsers.
4. Store submissions locally and durably.
5. Prevent accidental duplicate submissions.
6. Provide a clear receipt after a successful submission.
7. Provide an administrator dashboard and CSV export.
8. Recover cleanly after an application or laptop restart.
9. Continue operating during a short mains power interruption.
10. Provide a tested fallback URL if local domain resolution fails on a particular phone.

## 3. Non-goals

The baseline system will not provide:

- Public internet access to attendees.
- Cloud synchronization during the event.
- Email or SMS delivery during the event.
- Social login, Google login, or other cloud authentication.
- Video streaming or large file uploads.
- Guaranteed support for 300 simultaneous attendees using only two access points.
- Automatic installation of certificates or applications on attendee phones.

Support for 300 simultaneous users is an expansion scenario and should use at least one additional access point after a venue-specific capacity test.

## 4. Capacity assumptions

The baseline design assumes:

- A maximum of 150 connected attendee devices.
- Primarily smartphones using 2.4 GHz or 5 GHz Wi-Fi.
- A form page of approximately 200–500 KB, including locally hosted assets.
- Submission payloads of approximately 5–20 KB.
- No image, audio, or document uploads.
- Most attendees load the form within a short arrival window.
- A possible burst in which many attendees submit within the same minute.
- One primary device per attendee, with address-space headroom for staff and secondary devices.

At 500 KB per initial page load, 150 attendees transfer approximately 75 MB in total. At 20 KB per response, 150 submissions transfer approximately 3 MB. These volumes are modest; the number of associated wireless devices matters more than raw bandwidth.

## 5. Proposed architecture

```text
Attendee phones
      |
      |  Event Wi-Fi SSID
      v
Access Point 1 -----+
                    +---- Router / DHCP / local DNS ---- Gigabit Ethernet ---- Laptop
Access Point 2 -----+                                              |
                                                                   +-- Caddy web server
                                                                   +-- Form application
                                                                   +-- SQLite database
                                                                   +-- Admin dashboard
                                                                   +-- Local backups

WAN/Internet: physically disconnected
```

All wireless access points will use wired Ethernet backhaul. Wireless mesh or repeater backhaul will not be used because it consumes airtime and introduces an unnecessary additional failure mode.

## 6. Hardware requirements

### 6.1 Server laptop

Minimum recommended specification:

- Modern four-core Intel, AMD, or Apple Silicon processor.
- 8 GB RAM minimum; 16 GB preferred.
- Internal SSD with at least 20 GB free space.
- Gigabit Ethernet or a reputable USB-C-to-Gigabit-Ethernet adapter.
- Working battery.
- Windows 11, current macOS, or a current Ubuntu LTS release.

Ubuntu Linux is the preferred operational platform because it provides predictable service startup, networking, firewalling, Docker, and local DNS tooling. Windows and macOS remain viable if their sleep, update, firewall, and container settings are prepared and tested in advance.

### 6.2 Wireless access points

Two business-grade, dual-band access points are required. Each should provide:

- 802.11ac Wave 2 or Wi-Fi 6 support.
- Gigabit Ethernet uplink.
- Wired access-point mode.
- Centralized management.
- Band steering.
- Airtime fairness.
- Client load balancing or client limits.
- Adjustable radio power and channel width.
- Client isolation or compatible network ACL support.

Recommended examples:

- **Preferred Wi-Fi 6:** Two TP-Link Omada EAP650 or equivalent.
- **High-density alternative:** Two TP-Link Omada EAP620 HD or equivalent.
- **Budget Wi-Fi 5:** Two TP-Link Omada EAP225 V5 units.

For the baseline 100–150-user form workload, two EAP225 units provide an economical option, targeting roughly 75 attendees per access point. The current EAP225 V5 is published for 220+ concurrent clients under vendor test conditions and includes a passive-PoE adapter. Vendor maximums are ceilings rather than operational targets.

### 6.3 Router and switching

The network requires:

- A router capable of a `/23` IPv4 LAN.
- A DHCP pool containing at least 350 addresses.
- Local DNS records or the ability to advertise the laptop as DNS.
- Local firewall/ACL rules.
- At least four Gigabit Ethernet ports across the router and switch.

Suitable arrangements include:

1. An Omada ER605-class router plus a Gigabit switch.
2. An integrated Omada gateway/controller/PoE switch.
3. A small OpenWrt router plus an unmanaged Gigabit switch.
4. On Ubuntu, the laptop may provide DHCP and DNS directly, although a dedicated router is operationally cleaner.

If access points include PoE injectors, an unmanaged Gigabit switch is sufficient. Otherwise, use an 802.3af/at PoE switch with an adequate power budget.

### 6.4 Power and installation accessories

Required accessories:

- Cat6 cables for the laptop and both access points.
- Mounting hardware or stable elevated stands.
- Cable covers or tape suitable for venue safety.
- UPS sized for the router, switch, and two access points.
- Spare Ethernet cable and power adapter.
- Encrypted USB drive for secondary backups.

The access points should be placed above head height, separated across the occupied area, and away from large metal structures. Final placement must be validated at the actual venue.

## 7. Indicative bill of materials

Prices are indicative and should be replaced with supplier quotations before approval.

| Item | Quantity | Budget option | Preferred option |
|---|---:|---:|---:|
| Existing laptop | 1 | Existing asset | Existing asset |
| Business router | 1 | ₹4,000–₹6,000 | Integrated managed gateway if desired |
| Access points | 2 | EAP225-class: approximately ₹10,500 total | Obtain quotation for EAP650/EAP620 HD class |
| Eight-port Gigabit switch | 1 | ₹1,500–₹3,000 | ₹4,000–₹8,000 for PoE |
| PoE injectors | 2 | Included with some AP models | Included or supplied by PoE switch |
| UPS | 1 | ₹4,000–₹7,000 | ₹6,000–₹10,000 |
| Cables, stands, spares | Set | ₹2,000–₹5,000 | ₹3,000–₹7,000 |

A practical budget implementation using two EAP225-class access points and included injectors is expected to be materially less expensive than a premium Wi-Fi 6 deployment while remaining suitable for the stated form-only workload.

## 8. Network design

### 8.1 Address plan

Proposed IPv4 configuration:

| Purpose | Address |
|---|---|
| Network | `10.20.0.0/23` |
| Subnet mask | `255.255.254.0` |
| Router/gateway | `10.20.0.1` |
| Laptop server | `10.20.0.10` |
| DHCP pool | `10.20.0.50` through `10.20.1.250` |
| Local DNS | `10.20.0.1`, or `10.20.0.10` if hosted by the laptop |
| DHCP lease | 4–8 hours |

A `/23` provides approximately 510 usable addresses, leaving room for attendees, staff, access points, and secondary devices.

### 8.2 Wireless configuration

Proposed attendee SSID:

```text
SSID: BizDateUp Event
Security: WPA2/WPA3 mixed mode
Password: event-specific, printed on venue signage
Bands: 2.4 GHz and 5 GHz
```

Radio configuration should include:

- One shared SSID on both access points.
- 5 GHz preferred through band steering.
- 2.4 GHz retained for compatibility.
- 20 MHz channel width on 2.4 GHz.
- 40 MHz channel width on 5 GHz; use 20 MHz if the venue is congested.
- Non-overlapping channels permitted by the configured Indian regulatory domain.
- Moderate transmit power rather than maximum power.
- Airtime fairness enabled.
- Load balancing or a soft client limit of approximately 80–90 clients per access point.
- Wireless mesh disabled.
- Automatic channel selection used only after a venue scan, or channels fixed after testing.

### 8.3 Network isolation

Attendee devices should be allowed to reach:

- DHCP on the router.
- DNS on the router or laptop.
- TCP ports 80 and 443 on `10.20.0.10`.

Attendee devices should be blocked from:

- Communicating directly with other attendee devices.
- Opening router, switch, or access-point administration interfaces.
- Reaching the administrator dashboard unless explicitly authorized.
- Reaching a management VLAN or management SSID.
- Reaching WAN or the public internet.

A generic “guest network” mode must be tested carefully because some routers block access to all private addresses, including the event server. Explicit ACL rules are preferred.

## 9. Domain name and HTTPS

### 9.1 Local DNS

The local DNS server will map:

```text
event.bizdateup.com -> 10.20.0.10
```

Attendee phones receive this DNS server through DHCP. The intended form URL is:

```text
https://event.bizdateup.com/questions
```

The application should also redirect the common typo path `/quesitons` to `/questions`.

### 9.2 HTTPS certificate

If `bizdateup.com` is controlled by the organization, a publicly trusted certificate should be obtained before the event using DNS-based validation. The certificate and full chain will be installed on the laptop. Renewal is not required during the event, but the certificate must remain valid for the entire deployment period.

A locally generated certificate is not recommended because attendee phones would not trust the local certificate authority without manual configuration.

### 9.3 Fallback URL

Some phones may use private DNS or unusual DNS-over-HTTPS behavior. Signage must therefore include a fallback QR code for:

```text
http://10.20.0.10/questions
```

The fallback is less desirable for sensitive information because it is not HTTPS, but it prevents local DNS behavior from blocking participation. If sensitive personal data is collected, the publicly trusted HTTPS path should be considered mandatory.

## 10. Software architecture

### 10.1 Recommended stack

- **Reverse proxy and TLS:** Caddy.
- **Application:** FastAPI/Python, or an equivalent lightweight server framework.
- **User interface:** Server-rendered mobile HTML with minimal JavaScript.
- **Database:** SQLite 3.51.3 or newer.
- **Deployment:** Docker Compose or native system services.
- **Management:** Local administrator dashboard.
- **Exports:** CSV, with optional XLSX generation.

The application must not request any external resource. JavaScript, CSS, images, fonts, icons, and validation logic must be packaged locally.

### 10.2 Application components

The application will contain:

1. **Participant form:** Questions, validation, local drafts, and final submission.
2. **Submission API:** Validates, deduplicates, stores, and acknowledges responses.
3. **Administrator dashboard:** Submission count, event status, health, and export.
4. **Backup service:** Produces safe database snapshots at regular intervals.
5. **Health service:** Reports application, database, disk, and backup status.

Suggested routes:

```text
GET  /questions
POST /api/submissions
GET  /submission/{receipt_code}
GET  /health
GET  /admin
GET  /admin/submissions
GET  /admin/export.csv
POST /admin/event/open
POST /admin/event/close
```

### 10.3 Participant form behavior

The form should:

- Render correctly on narrow mobile screens.
- Support text, choice, checkbox, rating, and optional long-text questions.
- Save drafts to browser local storage.
- Validate required fields before transmission.
- Disable repeated button presses while submitting.
- Retry safely after a transient failure.
- Display a clear success screen and receipt code.
- Preserve the draft until the server confirms successful storage.

### 10.4 Duplicate prevention

The browser generates a random client/submission token. The server enforces a uniqueness rule such as:

```text
UNIQUE(event_id, submission_token)
```

If a browser retries the same request, the server returns the existing receipt rather than inserting a duplicate response.

### 10.5 Database model

Suggested tables:

#### `events`

- Event identifier.
- Name and URL slug.
- Open/closed status.
- Opening and closing timestamps.
- Question-schema version.

#### `questions`

- Event identifier.
- Stable question key.
- Question type.
- Prompt.
- Required flag.
- Display order.
- Options stored as JSON.

#### `submissions`

- Submission UUID.
- Event identifier.
- Browser/client token.
- Receipt code.
- Question-schema version.
- Answers stored as JSON.
- Creation and update timestamps.
- Status.

#### `audit_log`

- Administrative action.
- Actor.
- Timestamp.
- Non-sensitive metadata.

Recommended SQLite configuration:

```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=FULL;
PRAGMA foreign_keys=ON;
PRAGMA busy_timeout=5000;
```

The application should use one short, serialized database-writing path. Multiple web-server workers are unnecessary for this workload. Keeping each submission transaction short allows a burst of small writes to be committed rapidly while avoiding lock contention.

SQLite must remain on the laptop's local SSD, not on a network share or consumer synchronization folder.

## 11. Administrator functions

The local dashboard should provide:

- Event open/closed state.
- Total confirmed submissions.
- Recent submission activity.
- Last successful submission time.
- Application and database health.
- Available disk space.
- Last successful backup.
- CSV export.
- Optional receipt lookup.

The dashboard should not expose full answers on the attendee network unless required. Administrator access should require a strong password and preferably be limited to a wired connection or separate management SSID.

## 12. Deployment model

### 12.1 Directory structure

```text
event-system/
  application/
  config/
  certificates/
  data/
    event.sqlite3
  backups/
  exports/
  logs/
```

### 12.2 Pre-event preparation

Before arriving at the venue:

- Install every dependency and container image.
- Verify that no startup step downloads anything.
- Install the HTTPS certificate and full chain.
- Configure automatic service startup.
- Configure the static Ethernet address.
- Configure inbound firewall rules for ports 80 and 443.
- Disable sleep, hibernation, automatic restart, and automatic updates.
- Configure laptop lid-close behavior.
- Verify correct system date and time.
- Produce printed Wi-Fi and URL QR codes.
- Create an initial encrypted backup.

The system must be tested after physically disconnecting all internet access.

## 13. Backup and recovery

Backup strategy:

1. Primary SQLite database on the laptop SSD.
2. Safe SQLite online backup every five minutes.
3. Secondary encrypted copy on a USB drive.
4. CSV export at event close.
5. Final database snapshot before equipment shutdown.

The raw SQLite file should not be copied blindly while WAL transactions are active. The application should use SQLite's online backup API or perform a controlled checkpoint and backup.

Recovery must be rehearsed by restoring a backup into a clean application instance and verifying record counts and exports.

## 14. Security and privacy

Required controls:

- WPA2/WPA3 event network security.
- Publicly trusted HTTPS certificate when collecting personal information.
- Full-disk encryption using BitLocker, FileVault, or LUKS.
- Strong administrator credentials.
- Client-to-client network isolation.
- Restriction of network administration interfaces.
- CSRF protection on administrator actions.
- Maximum request-body limits.
- Server-side input validation.
- No response content in normal HTTP access logs.
- Automatic session expiry.
- Encrypted USB backups.
- Defined retention and deletion policy after the event.

Only information required for the event should be collected.

## 15. User journey

Recommended attendee instructions:

```text
1. Join Wi-Fi: BizDateUp Event
2. Enter the displayed Wi-Fi password
3. Scan the questionnaire QR code
4. Complete the form
5. Press Submit once
6. Keep the receipt screen until event staff confirm completion
```

A captive portal may be configured as a convenience, but the printed QR code is the primary entry mechanism because captive-portal detection varies among phones.

## 16. Testing and acceptance

### 16.1 Application load testing

Before deployment, a local load test should simulate:

- 200 simultaneous form loads.
- 200 submissions over a short burst.
- Repeated submission retries.
- Concurrent admin dashboard use.
- CSV export while submissions continue.
- Application restart during pending browser retries.

### 16.2 Wireless testing

Automated load testing does not test Wi-Fi behavior. The deployment should be rehearsed with as many real phones as practical, including both Android and iPhone devices.

Testing should cover:

- Simultaneous Wi-Fi association.
- DHCP address allocation.
- Local DNS resolution.
- HTTPS certificate validation.
- QR-code behavior.
- Coverage at room edges.
- Load distribution between access points.
- Interference from venue Wi-Fi.
- Failure of one access point.

### 16.3 Failure testing

Test the following failures:

- Internet/WAN disconnected.
- One access point powered off.
- Router reboot.
- Application process terminated and restarted.
- Laptop temporarily unplugged.
- Duplicate Submit presses.
- Browser refreshed during submission.
- DNS unavailable, using fallback IP URL.
- Database restored from backup.

### 16.4 Acceptance criteria

The system is ready for production when:

- It starts and operates with WAN physically disconnected.
- At least 150 simulated clients can load and submit without data loss.
- Real-device testing demonstrates coverage throughout the venue.
- Every successful submission produces a unique receipt.
- Duplicate retries do not create duplicate records.
- A restart preserves all confirmed records.
- Backup restoration succeeds.
- The administrator can export all responses.
- Network and server operation survives the agreed power-loss interval.

## 17. Event-day runbook

### Three to seven days before

- Freeze application and question versions.
- Confirm certificate validity.
- Perform application load test.
- Verify all equipment, adapters, and cables.
- Produce a tested backup laptop package.

### Venue setup

- Position and cable both access points.
- Connect all networking equipment to the UPS.
- Connect the laptop by Ethernet.
- Confirm WAN is disconnected.
- Start router, switch, access points, and laptop.
- Verify DHCP, DNS, HTTPS, form submission, dashboard, and backup.
- Walk-test the room with several phones.

### During the event

- Monitor connected clients per access point.
- Monitor submission count and last-submission time.
- Confirm five-minute backups continue.
- Keep a spare Ethernet cable and power adapter accessible.
- Direct users to the fallback QR only when necessary.

### Event close

- Close new submissions in the dashboard.
- Confirm expected submission count.
- Export CSV.
- Run a final database backup.
- Copy the encrypted backup to the USB drive.
- Verify backup size and record count.
- Shut down the application cleanly before disconnecting equipment.

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Venue radio interference | Slow joins or unreliable coverage | Perform RF scan; use non-overlapping channels; adjust channel width and placement |
| Too many clients on one AP | Uneven performance | Enable band steering/load balancing; separate APs; monitor client counts |
| Laptop sleeps or restarts | Temporary outage | Disable sleep/updates; run services automatically; use battery power |
| Router or AP loses power | Network outage | Use UPS; retain spare power adapters |
| Local DNS bypassed by phone | Domain does not resolve | Provide direct-IP fallback QR |
| Certificate expires or clock is wrong | HTTPS warning | Validate certificate and system time before event |
| Duplicate submissions | Incorrect counts | Idempotency token and database uniqueness constraint |
| Database write contention | Failed submission | Short transactions, one write path, WAL, busy timeout, retries |
| Database corruption or device loss | Data loss | Online backups, encrypted USB copy, tested restore process |
| Generic guest isolation blocks server | Form inaccessible | Use explicit ACLs and test attendee-to-server access |
| Attendance exceeds design | Wi-Fi instability | Pre-register device estimates; add a third AP for higher capacity |

## 19. Expansion path to 300 users

The application server and SQLite design can remain substantially unchanged for 300 form users. The wireless network should be expanded and retested.

Recommended changes:

- Add at least one additional business access point; four provides better headroom in a difficult venue.
- Target approximately 75–100 attendees per access point.
- Retain the `/23` network, which already provides sufficient address space.
- Use centralized AP management and explicit per-radio/client limits.
- Conduct a venue rehearsal with substantially more physical devices.
- Consider a dedicated business router/controller rather than a consumer router.

Two access points should not be represented as a guaranteed 300-client solution without a successful full-scale venue test.

## 20. Implementation plan

### Phase 1: Requirements and procurement

- Finalize questions, attendee identification, privacy requirements, and receipt rules.
- Select laptop platform.
- Select router, access points, switch, and UPS.
- Confirm ownership of the intended domain.

### Phase 2: Application build

- Implement participant form and local drafts.
- Implement submission validation and idempotency.
- Implement SQLite schema and migrations.
- Implement success receipt.
- Implement administrator dashboard and CSV export.

### Phase 3: Packaging and network integration

- Package the application and all static assets.
- Configure Caddy and certificates.
- Configure router, DHCP, DNS, ACLs, and access points.
- Configure startup, firewall, backups, and health monitoring.

### Phase 4: Verification

- Run application load tests.
- Run offline and recovery tests.
- Perform real-device rehearsal.
- Perform venue survey and final radio tuning.
- Produce event-day documentation and printed signage.

## 21. Deliverables

The completed project should deliver:

1. Packaged offline application.
2. Participant questionnaire interface.
3. Local SQLite database and migration tooling.
4. Administrator dashboard.
5. CSV export.
6. Caddy HTTPS configuration.
7. DHCP and local DNS configuration.
8. Access-point configuration export.
9. Automated backup and restore procedure.
10. Load-test scripts and results.
11. Event-day runbook.
12. Printed Wi-Fi and questionnaire QR artwork.

## 22. Recommendation

Proceed with the two-wired-access-point architecture for the original 100–150-user requirement. Use business access points even if selecting an older, less expensive Wi-Fi 5 model. Keep the laptop wired, package every software dependency locally, use a `/23` address range, provide a trusted HTTPS path plus direct-IP fallback, and treat real-device rehearsal as a release requirement.

For a cost-conscious implementation, two EAP225 V5-class access points with their included PoE injectors, a business router, an unmanaged Gigabit switch, and a UPS provide a reasonable baseline. If the event becomes business-critical, uses a difficult venue, or must support materially more than 150 simultaneous devices, upgrade the radio layer before increasing laptop capacity.

## 23. Technical references

- [TP-Link India EAP225 specifications](https://www.tp-link.com/in/business-networking/omada-sdn-access-point/eap225/v5/)
- [TP-Link EAP650 specifications](https://www.tp-link.com/us/business-networking/omada-sdn-access-point/eap650/)
- [TP-Link EAP620 HD datasheet](https://static.tp-link.com/upload/product-overview/2026/202602/20260226/Datasheet_EAP620%20HD%203.30.pdf)
- [SQLite write-ahead logging documentation](https://sqlite.org/wal.html)
- [dnsmasq documentation](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)
- [Caddy automatic and local HTTPS documentation](https://caddyserver.com/docs/automatic-https)
- [Let's Encrypt DNS-01 challenge documentation](https://letsencrypt.org/docs/challenge-types/)
- [Android captive portal documentation](https://developer.android.com/about/versions/11/features/captive-portal)
