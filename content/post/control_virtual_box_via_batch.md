---
title: "Control VirtualBox VMs via Batch"
date: 2021-12-28
Description: ""
Tags: ["virtual box", "windows", "batch"]
Categories: []
DisableComments: false
---

VirtualBox GUI is slow for repetitive tasks such as starting & stopping virtual
machines. In addition, some tasks such as starting VMs **headless** is not
possible at all.

On the other hand, `VBoxManage.exe` with its 842 lines of unsorted help output
is unwieldy for everyday use.

To get around both limitation I like to keep a few batch files on my desktop
for recurring tasks.

## Start

One script for each virtual machine to start it:
```bat
:: headless requires VirtualBox >5.0
"%ProgramFiles%\Oracle\VirtualBox\VBoxManage.exe" startvm "Mars" --type headless
```

You can use `--type gui` for the default behaviour of showing a GUI window
for the VM, instead.

## Stop All

Before shutting down your host machine, or to save on battery power, you want
to stop all machines:

```bat
"%ProgramFiles%\Oracle\VirtualBox\VBoxManage.exe" controlvm "Mars" acpipowerbutton
"%ProgramFiles%\Oracle\VirtualBox\VBoxManage.exe" controlvm "Merkury" acpipowerbutton
:: additional VMs...
```

Instead of using `acpipowerbutton` which performs a clean shutdown, you could
also use `savestate` to save the current VM state to disk, to restart it later.

The same start batch script will work for both modes.

## Status

These scripts allow me to not run VirtualBox GUI at all. The downside
is that I sometimes forget which state my VMs are in, running vs. shutdown.

A simple status script helps me to check on my VMs without starting the GUI.

```bat
"%ProgramFiles%\Oracle\VirtualBox\VBoxManage.exe" list runningvms
@pause
```

### Sources

[SuperUser StackExchange](https://superuser.com/a/996832)
