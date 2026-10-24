## Hugo Theme

A small custom theme in `layouts/`, built from the design system in `design/`
(start with `design/HANDOFF.md` and `design/BRAND.md`; preview components with `./design/scripts/preview.sh`).

### Diagrams

Write D2 diagrams as `.d2` files next to a post's `index.md` and embed them with
`{{< diagram src="name.svg" alt="…" caption="…" >}}`. Render them with
`./scripts/render-diagrams.sh` (needs `d2`, e.g. `nix shell nixpkgs#d2`) and commit the `.svg` files;
CI does not render diagrams.

### Proof read / Style check

```
Review the following blog post for any spelling or grammatical mistakes. Instead of fixing the issues in the text, provide a list of the suggested changes so I can apply them myself. Highlight the changes clearly and provide a brief explanation for each one. If you have any suggestions for improving the style or structure of the text, feel free to include them as well.
```

### Generate cover images

ComfyUI SDXL with Positive Prompt:

```
A majestic
[animal/feature/mountain/etc]
in a clean, stylized fantasy art with modern shading. The artwork showcases a Nordic color palette, featuring muted greys and blues that evoke elegance and simplicity. The composition is visually balanced and focuses on nature or animals, symbolizing strength, resilience, or calmness. Fine details emphasize the subject without clutter, creating a serene yet impactful aesthetic. Fill out the whole image. Centered object.
```

Negative Prompt:

```
Exclude any words, text, symbols, or icons. No frames or borders. Avoid overly complex or abstract compositions, hyperrealism, photorealism, bright or neon colors, and overly detailed patterns. Do not include humans, urban settings, or elements that clash with a clean and minimal style. Exclude cartoonish exaggeration or childish designs.
```

Output dimensions `1536` x `640`.


## Promo Posts

### Home Lab 00

```
Come join me on a journey building out a #Kubernetes #homelab. This will be an environment to study for my #Kubestronaut certifications. In this first post we will bootstrap a #kubeadm cluster using Infrastructure as Code (IaC) based on #libvirt and #kvm.
TODO: LINK
```

### Home Lab 01


```
The #kubernetes #homelab saga continues. In this weeks post we will answer the age old
question: "Which came first the #CNI or #GitOps?" by analysing the dependencies
between #Flux and #Cilium.
TODO: LINK
```

### Home Lab 03

```
I just published the next post in the #kubernetes #homelab series, on my journey
to #kubestronaut. In this post we will get traffic into our cluster, by setting
up an #nginx Ingress controller and #metallb.
https://blog.kammel.dev/post/k8s_home_lab_2025_03/
```

### Home Lab 04

```
After a one week hiatus, we are back on track with the #kubernetes #homelab series.
In this post we will secure our cluster by setting up #cert-manager and connecting
it to #cloudflare and #letsencrypt, for automatic TLS certificate generation.
https://blog.kammel.dev/post/k8s_home_lab_2025_04/
```
