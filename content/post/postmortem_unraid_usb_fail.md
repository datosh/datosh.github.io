---
title: "Postmortem: unRAID Flash Device Failure"
date: 2022-01-23T16:43:44Z
Description: ""
thumbnail: "images/thumbnails/postmortem_unraid.png"
Tags: []
---

**Status:** Complete, action items in progress.

**Summary:** [unRAID's OS](https://unraid.net/)
Flash Device failed undeteced for 14 days, preventing server
to successfully reboot, taking all internal services down, including
[pfSense](https://www.pfsense.org/)
VM which prevented home network from accessing internet.

**Impact:** 2 hours of limited internet access (mobile data plan).
Internal services still offline, due to broken configuration.

**Root Cause:** Flash device failed undeteced. No backup & limited internet
access delayed mitigation.

**Trigger:** Failing reboot of unRAID server.

**Resolution:** Since no backup of unRAID flash device was available,
I reinstalled unRAID onto new flash device. Activation of unRAID trial
license or requesting replacement key
[without internet access was impossible](https://forums.unraid.net/topic/55382-no-internet-no-unraid/).
Since unRAID does not support WiFi, direct usage of mobile data plan was not
possible.
In the end, I used Windows
[Internet Connection Sharing (ICS)](https://en.wikipedia.org/wiki/Internet_Connection_Sharing)
feature and mobile data plan to get wired home network temporarily back online,
so unRAID key could be requested for new flash device.
[Assigned disks in unRAID array from memory](https://wiki.unraid.net/Manual/Changing_The_Flash_Device#What_to_do_if_you_have_no_backup_and_do_not_know_your_disk_assignments)
to boot pfSense VM, and home network back online.
Original unRAID configuration was lost, and still needs to be re-created
from memory to get all internal services back online.

**Detection:** Broken web UI, when trying to instantiate new VM. All other
services were still running fine.

**Action Items:**

* [Restore unRAID configuration](https://github.com/datosh/home/issues/4)
* [Automated cloud backup of unRAID flash device](https://github.com/datosh/home/issues/1)
* [Automated backup of pfSense config](https://github.com/datosh/home/issues/3)
* [Document mobile data & windows router setup](https://github.com/datosh/datosh.github.io/issues/1)
* [Implement alerting of unRAID system log errors](https://github.com/datosh/home/issues/5)

## Lessons Learned

### What went well

* Outage was fixed in a timely manner, despite many technical
limitations of home network.
* No critical internal service data was lost in process, only service
configuration.

### What went wrong

* Should have saved more information (system log) or tried to save config
(usb backup) before deciding to reboot faulty system.

### Where we got lucky

* Lucky to find Windows mobile data share feature.
* Remembered disk assignments in unRAID arrays.

## Timeline

2022-01-09
* unRAID system logs produced first errors on `/boot/*` not being accessible

2022-01-23
* 14:25 When trying to spin up a new VM, I notice broken unRAID UI.
* 14:30 Check unRAID syslog and see errors starting from January 9th re. broken
`/boot/` folder.
* 14:50 OUTAGE BEGINS - Decide to reboot server
* 14:52 Server unable to boot
* 15:10 OUTAGE MITIGATED - Mobile access point deployed
* 15:15 Verified that flash device is broken on second machine.
* 15:20 Reinstall unRAID onto new flash device, since no backup is available.
* 15:30 Searching for a solution to get wired internet connection onto any
machine so unRAID license can be moved.
* 15:40 Deploying Windows ICS & reconfiguring unRAID to use new gateway.
* 15:45 unRAID successfully activated
* 16:00 Switch back to original unRAID network config and boot unRAID.
* 16:15 Restore unRAID disk assignments manually, and verify using various
`mount` commands
* 16:30 unRAID array back online.
* 16:35 Boot pfSense VM
* 16:41 OUTAGE ENDS - Server & pfSense booted and configured

2022-01-xx
* xx:xx Full unRAID configuration manully restored
* xx:xx docker containers manually restarted

---

This is based
[Google’s Postmortem Philosophy](https://sre.google/sre-book/postmortem-culture/)
and their
[Example Postmortem](https://sre.google/sre-book/example-postmortem/).
