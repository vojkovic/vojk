+++
authors = ["Brock Vojkovic"]
title = "Tor Vanity Addresses"
date = "2024-08-27"
math = true
tags = [
    "tor",
    "crypto",
    "web",
]
+++
---

*Originally written in October 2023, but unpublished until August 2024. This post discusses Tor v3 address, without mention of any legacy formats.*

# What is a Tor address?

A reason the Tor Network is so resistant to censorship stems from its inherently decentralised architecture. Unlike a traditional DNS which has a centralised governance structure with organisations like ICANN having a say in the domain name allocation process, Tor's decentralised nature means there's no single authority governing the issuance of onion addresses. But if there's no authority, how are Tor addresses created?

Tor addresses, also referred to as "onion addresses", are generated using a cryptographic process. A server creates a key pair, specifically using Ed25519. This generates two keys: a public key and a private key. The private key is kept secret and is used for proving ownership of the public key. The onion address is then created using the public key. This makes onion addresses self-certifying. 

Above is the basic definition, in practice it's a little more complicated than that. There's also a few constants appended to the start and end of the a hashed public key which is all then concatenated together and then encoded into a human-friendly format with Base32. This creates a 56 character string which then becomes the hostname. [I wrote a python script if you're interested in the details.](https://github.com/vojkovic/OnionDomainGen/blob/main/main.py)

One interesting fact about Tor addresses is because they are Base32 encoded which uses an alphabet of A–Z, followed by 2–7, it's impossible for a Tor address to have the digits 0, 1, 8 or 9.

Here are some examples of your typical Tor addresses:

- py5hfssnlc62ou5ymrgkdsk3nqjpvmqyab2embfeokehzhqwrqxvrtqd.onion
- nl73tmcncviy2tokayao4y3nmk6o7sza2gjmrow7b2l6uemfpd66rqqd.onion
- 3vf2humev2rc3ulsxqj7qui35rkyqforv5lddbrneaoewnrvyl6wfwid.onion

Many people would agree that they're pretty unappealing to look at. This is because they're a product of a cryptographic process that wasn't built for easy memorisation. 

This is where vanity addresses come in.

---

# What are Tor vanity addresses?

From the [Tor Project](https://community.torproject.org/onion-services/advanced/vanity-addresses/):

> "Vanity" onion addresses are a partial workaround for the difficulty of memorizing the 56-char long onion addresses.

Most commonly, vanity addresses start with a pre-chosen number of characters. Usually the website admin choose this prefix to be a meaningful name related to a specific Onion Service. For example, the onion location for my old invidious instance was

`invidiousge2cq2qegp4vdzsfu6mvpqdf6dtcyzmqbv7yx2spvkkajad.onion`

The first nine characters spell the name of the service, 'invidious'. There's a reason only nine characters are being used as a prefix, I'll explain why later.

---

# Mining Vanity Addresses

The current gold standard in mining vanity addresses is [mkp224o](https://github.com/cathugger/mkp224o). Depending on your hardware, this tool can generate up to hundreds of millions of Ed25519 keypairs each second. It then converts the public key into Base32 and checks the result for a desired prefix. It's a very handy bit of software and makes you appreciate the incredible speed of modern processors.

## Get started

This section will cover a lot of the content mentioned in the [README](https://github.com/cathugger/mkp224o/blob/master/README.md).

### Building mkp224o from source:

#### 1) Install Dependencies:
- C99 compatible compiler (gcc or clang works)
- libsodium (with headers)
- GNU make
- GNU autoconf

##### For Debian-based systems (Ubuntu, Debian, Mint):

```bash
$ apt install gcc libc6-dev libsodium-dev make autoconf
```

##### For Arch-based systems (Arch Linux, Manjaro, Artix):

```bash
$ pacman -S gcc libsodium make autoconf
```

#### 2) Clone the Git Repository

```bash
$ git clone https://github.com/cathugger/mkp224o.git && cd mkp244o
```

#### 3) Generate the makefile

If there isn't already a configure script, run

```bash
$ ./autogen.sh
```

Now you can run the configure script to generate the makefile:


```bash
$ ./configure
```

Note: On *BSD platforms, you may need to specify extra include/library paths:

```bash
$ ./configure CPPFLAGS="-I/usr/local/include" LDFLAGS="-L/usr/local/lib"
```

In a later section of this post we're going to be passing different parameters to optimise mkp224o for your processor. If you run `./configure --help` you can see all the available options.

#### 4) Make mkp224o

Now you can run make to build mkp244o. (gmake in *BSD platforms).

```bash
$ make -j$(nproc)
```

This will now create an executable named `mkp224o`.

### Using mkp224o:

Before running, mkp224o will first need to be provided with a list of filters. Filters can be specified as command line arguments: e.g. `./mkp224o example`. You can also use multiple filters at the same time: e.g. `./mkp224o example1 example2 example3`. Alternatively, filters can also be loaded from a file using the **-f** switch: e.g. `./mkp224o -f filters.txt`.

When mkp224o matches a hostname to one of your filters, it will create a directory with secret/public keys and the hostname. By default, the working directory is the current directory, but that can be overridden with the **-d** switch. e.g. `./mkp224o -d ./output/ example`

There's also the **-s** switch, which enables the printing of statistics, which will come in handy when we're benchmarking different Ed25519 implementations later on.

---

# Optimisation

One large optimisation we can make is to search for multiple prefixes at the same time. In terms of the computing cost required, the encryption is expensive whilst string comparisons are cheap. Every address generated should be tested against everything that you can imagine ever looking for, otherwise it's a wasted opportunity. 

---

# Estimating the time required

As mentioned, Tor addresses are created with Base32 encoding. Therefore, the probability for an address to start with a prefix of n letters would be $\frac{1}{32^n}$. When I ran a benchmark of my processor, I found that it would roughly generate 100,000,000 addresses each second. Therefore, I was able to create a function to calculate to estimate how many seconds it would take on average to find an address with a prefix of n letters.

$time(n) = \frac{\text{Total number of possible addresses with the specified prefix length}}{\text{Processing rate (addresses per second)}} = \frac{32^n}{100,000,000}$

Here's a table for how many long it will take on average to find an onion address with an n letter prefix on a typical modern desktop processor. If n is less than 5, it's pretty much instantaneous.

$
    \begin{array}{|c|c|}
    \hline
    \text{n} & \text{Time} \\\
    \hline
    5 & 335\text{ ms}\\\
    6 & 10.7\text{ secs}\\\
    7 & 5.73\text{ mins}\\\
    8 & 3.05\text{ hours}\\\
    9 & 4.07\text{ days}\\\
    10 & 4.28\text{ months}\\\
    11 & 11.4\text{ years}\\\
    12 & 365\text{ years}\\\
    13 & 11700\text{ years}\\\
    \hline
    \end{array}
$

---

# Final Thoughts

I did some back of the napkin math for the limits of Tor vanity addresses. As you can see from the table above, as you increase the number of letters in your prefix by one, it exponentially increases the time that the task will take by a factor of 32. Your average home user can realistically only generate a 9 character tor address. For a company or really dedicated home user, they could definitely reach a 10, maybe an 11 character prefix. For example, Proton's tor address is 10 characters:

[protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion](https://protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion/)

A single server processor alone is able to do 2-3x the number of operations per second than a typical modern consumer processor. At the scale of a datacenter with hundreds of processors, it would be trivial to find a 11 character prefix. I predict the largest tor vanity address we could ever see in the next decade will be 12 characters.

# Sources:

https://github.com/torproject/torspec/blob/main/rend-spec-v3.txt

https://en.wikipedia.org/wiki/.onion

https://nymity.ch/onion-services/pdf/sec18-onion-services.pdf

https://github.com/alecmuffett/eotk/blob/master/docs.d/TIPS-FOR-MINING-ONIONS.md

https://en.wikipedia.org/wiki/Base32

https://datatracker.ietf.org/doc/html/rfc4648#page-10

https://tor.stackexchange.com/questions/23119/why-do-all-the-generated-tor-v3-vanity-addresses-end-with-d

https://www.desmos.com/calculator/wzwuwtydfm