---
title: "How to get a .ip6.arpa TLS certificate for $0"
date: 2025-04-10
draft: false
tags: ["networking", "security"]
---

ARPA (Address and Routing Parameter Area) domains are a core component of internet infrastructure, primarily used for reverse DNS resolution (like in-addr.arpa and ip6.arpa). While it is unusual, you can host a website on a reverse DNS domain (see [this website](https://b.4.0.c.7.0.4.1.a.2.ip6.arpa/)). However, most Certificate Authorities (CAs) won't issue certificates for ARPA domains, so how do we get one?

If you've researched this topic, you might have found this [post suggesting to pay Cloudflare $120/year](https://web.archive.org/web/20250330063527/https://0.0.0.1.4.7.4.0.1.a.2.ip6.arpa/@caramel/statuses/01JJVVB2V6YKF2Y0HHPQ35KN31), but I'm stubborn and won't pay for a TLS certificate in the year 2025 (at least not for a three-month validity!).

For starters, common CAs won't issue certificates for ARPA domains. [Let's Encrypt called the practice an "RFC 3172 violation" and closed the Github issue](https://github.com/letsencrypt/boulder/pull/2279), ZeroSSL hangs on 'validating' the domain because their partner - Sectigo - doesn't support the ARPA domain, and Google Trust Services (GTS) rejected the certificate request outright. 

However, as some clever people online have already worked out, SSL.com will issue certificates for ARPA domains. But, it'll cost around $50/year if you buy directly from them - and I've already mentioned I'm not paying. The good news is you can get an SSL.com certificate for free using Cloudflare.

There is an issue though: their default certificate issuer - GTS - rejects certificate requests for ARPA domains. This is where we need to use a little trick to switch to SSL.com, which will issue the certificate. After consulting Cloudflare's official documentation, I found how to change a zone's certificate issuer. The process is fairly straightforward. You'll need your Cloudflare Global API Key and Zone ID. Then, run the following command in your terminal:

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ssl/universal/settings" \
  -H "X-Auth-Email: ${EMAIL}" \
  -H "X-Auth-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"certificate_authority":"ssl_com"}'
```

Make sure to replace:
- `${EMAIL}` with your Cloudflare account email (this must be the email you used to create the Cloudflare account)
- `${API_KEY}` with your Global API Key (you can find this in the [Cloudflare dashboard here](https://dash.cloudflare.com/profile/api-tokens))
- `${ZONE_ID}` with your Cloudflare Zone ID (which you can find in the Cloudflare dashboard, see below)

![Cloudflare Zone ID Location](/img/d34cda71f2dee5f96ef38e72d3da844b-1.png)

After running the command, you should see the certificate waiting for TXT verification on the page. If you don't see this, try disabling "Universal SSL" and then run the command again to re-enable it.

![Cloudflare Zone ID Location](/img/d34cda71f2dee5f96ef38e72d3da844b-2.png)

Finally, ensure the 'Proxy' mode is on in the DNS settings, set up your origin, and you should be good to go.

So in the end, we now have a TLS certificate, at the cost of - well... not actually having the certificate - Cloudflare won't let you download it. However, the solution has been working reliably in production, and I don't mind Cloudflare MiTM'ing traffic for this webpage. If you're not comfortable with that, I've seen that AlphaSSL might be able to issue certificates for ARPA domains [(CT log)](https://crt.sh/?id=13244859365) on the cheap (~$25/year), but I haven't tried it myself.
