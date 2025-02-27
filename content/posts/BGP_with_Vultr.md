+++
authors = ["Brock Vojkovic"]
title = "BGP with Vultr"
date = "2024-10-13"
tags = [
    "networking",
    "bgp",
]
+++
---

# Introduction

This post covers how to set up a BGP session with Vultr using BIRD 2. I found that the official Vultr documentation was somewhat lacking in this area, and mostly just covered BIRD 1 and didn't cover the IPv6 side of things. Vultr is a great provider for BGP because they offer it for free with any VPS, and it's where a lot of people get their start with BGP.

Vultr handles BGP a bit differently from most other providers. They give you a private ASN (`64515`) to peer with and also expect you to set up a static route to `2001:19f0:ffff::1/128`, which isn't mentioned in their documentation. If you're new to BGP, this can get quite confusing, which is why I'm writing this post.

Before I share my BIRD configuration, I'll explain what parts of the configuration are specific to me and what parts you'll need to change to suit your setup.
- My ASN is `44354`. This is a public ASN that I operate, but Vultr can assign you a private ASN if you don't have one and your prefixes will be announced with their public ASN.
- My Public IPv4 address is `139.180.209.121`. Although we're not using IPv4 for BGP, it's best practice to use it as the router ID because it's a globally unique identifier. This applies to if you ever end up doing BGP outside of Vultr as well.
- My Public IPv6 address is `2401:c080:1400:616a:5400:5ff:fe10:3e85`. Ensure that this is the address that Vultr has assigned to your server and not another one that your server might have assigned itself.
- The primary interface is `eth0` and my dummy interface is `dummy1`. I will explain how to set up the dummy interface later in the post. You can view what interfaces you have with `ip a`.
- The password I share with Vultr is `hunter2`.
- I'm announcing two /44 blocks, `2a14:7c0:4b10::/44` and `2a14:7c0:4b00::/44`.

# BIRD Configuration

```bash
log syslog all;

router id 139.180.209.121;

protocol device {
    scan time 5;
}

protocol direct {
    interface "dummy*";
    ipv6;
}

protocol static {
    ipv6;
    route 2a14:7c0:4b10::/44 reject;
    route 2a14:7c0:4b00::/44 reject;
}

protocol static STATIC6 {
    ipv6;
    route 2001:19f0:ffff::1/128 via fe80::5400:5ff:fe10:3e85%eth0;
}

protocol bgp vultr {
    description "vultr";
    local 2401:c080:1400:616a:5400:5ff:fe10:3e85 as 44354;
    neighbor 2001:19f0:ffff::1 as 64515;
    multihop 2;
    password "hunter2";

    ipv6 {
        import all;
        export filter {
            if source ~ [ RTS_DEVICE ]
            then accept;
            else reject;
        };
    };
}
```

If you're wondering how the link-local address is made, take the second half of the IPv6 address that Vultr has assigned to you (it will contain ff:fe in the middle) and append it to `fe80::`.
i.e. `fe80::5400:5ff:fe10:3e85` is the link-local address for `2401:c080:1400:616a:5400:5ff:fe10:3e85`.

You will also need to add the static route to `2001:19f0:ffff::1/128` as mentioned earlier. This is because Vultr expects you to have a static route to their BGP server because they use multihop.

Also make sure that you have set up the dummy interface in `/etc/network/interfaces`:

```bash
auto dummy1
iface dummy1 inet6 static
pre-up /sbin/ip link add dummy1 type dummy || true
post-up /sbin/ip link set dummy1 up
post-up /sbin/ip -6 addr add 2a14:7c0:4b10::1/44 dev dummy1
post-up /sbin/ip -6 route add local 2a14:7c0:4b10::/44 dev lo
post-up /sbin/ip -6 addr add 2a14:7c0:4b00::1/44 dev dummy1
post-up /sbin/ip -6 route add local 2a14:7c0:4b00::/44 dev lo
post-up /sbin/ip -6 route add 2001:19f0:ffff::1/128 via fe80::5400:5ff:fe10:3e85 dev eth0 src 2401:c080:1400:616a:5400:5ff:fe10:3e85
```

Then restart your networking service.

If you don't have a `/etc/network/interfaces` file, like if your server is running Debian, you can make a systemd service file to do the same thing:

```bash
[Unit]
Description=Create dummy1 interface
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/sbin/ip link add dummy1 type dummy || true
ExecStart=/sbin/ip link set dummy1 up
ExecStart=/sbin/ip -6 addr add 2a14:7c0:4b10::1/44 dev dummy1
ExecStart=/sbin/ip -6 route add local 2a14:7c0:4b10::/44 dev lo
ExecStart=/sbin/ip -6 addr add 2a14:7c0:4b00::1/44 dev dummy1
ExecStart=/sbin/ip -6 route add local 2a14:7c0:4b00::/44 dev lo
ExecStart=/sbin/ip -6 route add 2001:19f0:ffff::1/128 via fe80::5400:5ff:fe10:3e85 dev eth0 src 2401:c080:1400:616a:5400:5ff:fe10:3e85

[Install]
WantedBy=multi-user.target
```

After creating the file, reload systemd with `systemctl daemon-reload` and enable the service with `systemctl enable dummy1.service`.

Now, you can start BIRD and check the logs to see if everything is working. If you're having trouble, you can check the status of the BGP session with `birdc s p all`. If it says `Established`, then you're all good.

Some common issues that you might run into are:
- Port 179 blocked by firewall: Ensure that your firewall allows inbound and outbound traffic on TCP port 179 for BGP.
- Dummy interface setup issues: Verify the dummy interface is properly created and assigned the correct addresses.
- You're not using the exact /128 address that Vultr has assigned to you. You have to use the exact address, not a different one that your server might have assigned itself from the same /64.
- Keep in mind, Vultr's minimum acceptable prefix length is a /48, which aligns with the minimum prefix length allowed for internet routing as per [RFC 7454 6.1.3](https://datatracker.ietf.org/doc/html/rfc7454#section-6.1.3).
