---
status: ready
priority: p1
issue_id: 001
tags: [partners, addition, sequence]
dependencies: []
---

# Partner Permutations

I want to set up a new module to help with understanding the different partners that add up to a given number, i.e. 6 partners, 10 partners, 20 partners etc. The module should live in the `partners` directory.

This module should consist of two exercises. The exercises can be configured on the same page, but the results are not displayed together (or mixed together) like the other modules. Each of the exercises in this module needs to be laid out separately, so one above the other. No equations are mixed between the two.

## Exercise 1

The first exercise is practicing partners for a given number, e.g. 10 partners. These are represented as addition equations, similar to the addition exercise from the `add-sub` module. The order of the partners matters, we won't consider the same partners in a different order as the same. So 1+9 is different from 9+1, even though they consist of the same digits.

Some of the same configuration from the addition exercise applies here:

  - Total: the whole the partners need to add up to (as an integer)
  - Digits: Any, Double (if applicable), Single
  - hidden: Answer, Left Op., Right Op. or Random
  - equations: The number of equations to generate (bound by the whole)

## Exercise 2

The second exercise is for practicing partners in sequences. For a given total (above 6) it should should generate all the partners (including 0) and pick one that is omitted. It should be left completely blank to practice completing the sequence.

Each sequence should only display 6 items in the sequence: 3 before the blank and 3 after. If there are not enough lines in the sequence before or after the number should be distributed to the before or after. It should always come out to 6 sequence lines and 1 blank.

This is an example of what this might look like:

```
|-----------------|
|  0  +  6  =  6  |
|  1  +  5  =  6  |
|  2  +  4  =  6  |
| ___ + ___ = ___ |
|  4  +  2  =  6  |
|  1  +  5  =  6  |
|  6  +  0  =  6  |
|-----------------|
```

Each sequence should be printed on its own, with a max of 2 per row. Basically the same 2 columns as the other exercises. Each sequence should have a border around it to signal its a group.
