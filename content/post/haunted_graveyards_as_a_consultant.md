---
title: "The Hidden Risks of High-Quality Code"
date: 2024-12-04
Description: "The daily struggles of a consultant as a software engineer."
thumbnail: "images/thumbnails/haunted_graveyards.jpg"
Tags: ["consulting", "software engineering", "code quality"]
Draft: false
---

Popularized by Google[[1]](https://abseil.io/resources/swe-book/html/ch22.html#no_haunted_graveyards)[[2]](https://www.usenix.org/sites/default/files/conference/protected-files/srecon17americas_slides_reese.pdf), **Haunted Graveyards** are pieces of code that, while providing a business value, are [so ancient, obtuse, or complex that no one dares enter](https://abseil.io/resources/swe-book/html/ch22.html#no_haunted_graveyards) them.

Every organization has them: From one-off integration software for that one customer with deep enough pockets, to code that was hammered out too quickly to make the KPIs happy. The reasons for their existence are manifold, but the consequences are always the same: **They pose an existential risk to organizations.**

In the best case, they lead to accumulating inefficiencies (technical debt) as engineers work around them, or costly re-writes when the pain (for the business) becomes unbearable. In the worst case, they prevent an organization from adapting to changing business requirements, or react to security vulnerabilities, leading to significant financial and reputational damage.

## The Consultant's Dilemma: Code That Outpaces Its Owners

For consultants, this challenge is amplified. Often brought in for their expertise in a niche domain, consultants tend to operate at a higher technical level than the teams they integrate with. When their engagement ends, the code they leave behind may be of excellent quality, but still has a disproportionally higher risk of becoming a haunted graveyard.

### What is driving this phenomenon?

1. **Disregarding Team Skills:** Naturally, everyone wants to use the skills they have honed over the years. Latest design patterns and language features are exciting to use and (sometimes) more ergonomic than the "old way of doing things". However, this becomes a problem when the resulting implementation and the team's ability to maintain it do not align.
1. **No Sense of Ownership:** Even though consultants are usually the main author of a piece of code, they are rarely the owner. Neglecting to transfer ownership actively & effectively during an engagement will leave their owners unsure how to maintain it.
1. **Unclear Design Decisions:** The team understands what was built, but not *why* it was built in a particular way. Unclear trade-offs and failing to motivate design decisions will leave the new owners wondering why performance has degraded only a few PRs later.

With only a single of these conditions met, the code is at risk of becoming a haunted graveyard: a place no one dares to touch for fear of breaking something they don't fully understand.

## Avoiding Haunted Graveyards: Best Practices for Consultants

To prevent creating haunted graveyards, consultants can adopt these best practices:

### 1. **Contextual Simplicity Over Universal Elegance**
Consultants often default to implementing solutions using the most elegant or efficient techniques. However, if these techniques require specialized skills the team lacks, you risk alienating the maintainers.
- Prioritize **simplicity** and readability over cleverness.
- The solution should **match the team's skill level** and best practices.

### 2. **Active Knowledge Transfer**
Leaving behind documentation is necessary but insufficient. Active efforts to transfer knowledge are critical:
- Make sure reviews are not just rubber stamps, but opportunities for learning. This is a great attack point to *gradually* introduce more advanced concepts to the team, and **upskill them during your engagement**.
- Ensure the team can make changes and validate them independently before you leave.

### 3. **Build with Long-Term Ownership in Mind**
Design your work with the team's long-term ownership in mind:
- Use patterns and **technologies the team is already comfortable with**, unless there is a compelling reason to introduce new ones.
- Write code that is **self-documenting**. A clear error message is worth a thousand pages of documentation.
- Provide a **transition period** where you're available for follow-up questions or reviews.

### 4. **Collaborate Closely**
Especially in the early design phase of a project or feature, ensure that the team participates in key design decisions. This achieves multiple important goals:
- Reduce the cost of change by **catching misunderstandings early** (shift-left).
- Fosters a **sense of ownership** and reduces the likelihood of your work being perceived as a "black box".
- Establish a **shared understanding** and context that is vital in code reviews.

### 5. **Feedback Loops and Checkpoints**
Schedule regular checkpoints to verify the team's understanding of your contributions. Actively solicit feedback to identify areas where they feel less confident and adjust accordingly.

---

## Conclusion

A haunted graveyard is not always an issue of code quality, but may as well be a mismatch between code complexity and the team's ability to grapple with it. As a consultant, your goal is to avoid these scenarios by aligning your work with the team's capabilities, transferring knowledge effectively, and ensuring the team can confidently take ownership of your contributions.

The hallmark of a great consultant isn't just solving the problem at hand, it's empowering the team to thrive after you leave!
