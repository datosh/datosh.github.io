---
title: "Configure DNS:NET as ISP on pfSense Router"
date: 2022-01-05
Description: ""
Tags: ["pfsense", "dns:net", "vlan", "router"]
Categories: []
DisableComments: false
---

Since DNS:NET provides support only for a limited number of supported
routers, and pfSense is not on that list, I will share my configuration here.

This guide is aimed at **pfSense Community Edition Version 2.5.x**.

In the following configurations, parameters that are omitted should be left
empty or with their default value.

This configuration assumes that the WAN port is called **em0**. You can check
your network ports at **`Interface -> Assignments`**.

## Configure VLAN Tag

Go to **`Interface -> Assignments -> VLANs`** and
create a **new** VLAN with the following configuration:

* Parent Interface: **em0** (or your WAN interface)
* VLAN Tag: **37**
* Description: **dnsnet**

## Configure PPPoE

Also in the Interface section, go to `PPPs` and create a **new** PPP
configuration:

* Link Type: **PPPoE**
* Link Interface(s): **em0.37** (This is the VLAN interface we created in
previous step)
* Username & Password: These values are provided to you by DNS:NET, or can be
accessed using their
[customer portal](https://mein.dns-net.de/).

## Configure Interface Assignments

Go back to **`Interface -> Assignments`** and select **PPPOE0(em0.37)**
for your WAN Network Port.

Save & Apply! :) 
