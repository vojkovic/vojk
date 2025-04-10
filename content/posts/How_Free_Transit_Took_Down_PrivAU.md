+++
authors = ["Brock Vojkovic"]
title = "How Free Transit Took Down My Website"
date = "2024-11-01"
tags = [
    "networking",
    "bgp",
]
+++

*This event and article was written in November 2024 but published in April 2025.*

# How Free Transit Took Down My Website

I run a small anycast network for [priv.au](https://priv.au), a metasearch engine. This network consists of several servers strategically placed around the world, connected to different Internet Exchange Points (IXPs) and transit providers.

[Anycast](https://en.wikipedia.org/wiki/Anycast) is a routing technique that allows multiple servers to share the same IP address. When a user sends a request to that IP, the network routes it to the closest server. This improves performance and resilience by spreading the load across multiple locations.

## The Setup

I recently expanded my network by introducing a new Point of Presence (PoP) in Canada. Through my hosting provider, I obtained a port to ONIX (a Toronto Internet Exchange) and set up a small server to help with local routing in North America. Shortly after connecting to ONIX, Hurricane Electric (HE) reached out with an offer of free transit, and we established a BGP session (HE gives free IPv6 transit at mutual peering locations).

What happened next? Disaster.

## Understanding AS_PATH

Before diving into what went wrong, let's understand AS_PATH - a crucial concept in BGP routing. An AS_PATH is like a roadmap that shows how traffic reaches your network. Each AS (Autonomous System) number in the path represents a network your traffic passes through.

The length of this path matters significantly. BGP routers prefer shorter paths, assuming they're more efficient. This preference is known as the "shortest path first" principle. When multiple paths exist to the same destination, BGP will choose the one with the fewest AS numbers in its path. Of course, there are other BGP path selection criteria, but this is the most important one in this article.

![Example of AS_PATH visualization showing different routes to the same destination](/img/b11bfc814acb17bbfd7b595c506c774a-1.png)

For example, AS1 can reach AS7 by going through AS5, which is the shortest path. However, AS1 can also reach AS7 by going through AS2 and AS4, but this is a longer path. BGP will always choose the shortest path, so AS1 will choose the AS5 path.

## What Went Wrong

Once the BGP session went live, the VPS in Canada was immediately overwhelmed with traffic. All traffic destined for my prefix was being routed to this single VPS, creating a critical bottleneck in my network.

The root cause? AS_PATH selection.

Because Hurricane Electric is a Tier 1 provider with extensive peering, their AS_PATH to my prefix was shorter than any other available path. This made my Canadian VPS appear as the optimal route to reach my prefix, causing a massive influx of traffic that the server couldn't handle.

The VPS's resources were completely overwhelmed - I had inadvertently turned my network into a single point of failure.

## Fixing the Mess

The first step was immediate action. I shut down the BGP session with HE on the VPS to stop the flood of traffic. So, how did I fix it?

Well, there are a few ways to fix it. By far the easiest is to use AS_PATH prepending. This is a technique where you artificially lengthen the AS_PATH by repeating your AS number multiple times, making that route less attractive to other networks. For example, AS1 could prepend their AS number to the AS_PATH like this: AS1 -> AS1 → AS5 → AS7. By repeating their AS number twice, it makes the route less attractive to other networks.

The alternative is to use BGP communities, which makes the upstream provider make routing decisions based on the community value. For example, some providers will only advertise routes with a specific community value to networks in North America or a specific region, which would be another way to control the traffic. However, rather infamously, Hurricane Electric does not support BGP communities for free transit. Actually, I think they're one of the only major providers that charges their customers extra to use control communities.

I re-established the Canadian PoP and everything went back to peace and quiet.
