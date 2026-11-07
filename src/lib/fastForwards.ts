// Branches that were merged by fast-forward, so git kept no merge commit to show where they began.
// Recorded by hand: the commit the branch started from, and its last commit. Branches merged with
// --no-ff (the habit from now on) don't need an entry; their merge commits say it all.

export interface FastForward {
  name: string;
  /** The commit on main the branch grew from. */
  base: string;
  /** The branch's last commit, where main now stands. */
  tip: string;
}

export const FAST_FORWARDS: FastForward[] = [
  {
    name: 'sprite-machine',
    base: 'c2209f7b20e699d39b2389f0cecd5a1a706b71f3',
    tip: '6114571d7480898c5d3a968b9ae3a301e1fda159',
  },
];
