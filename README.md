# Healthy Paissas Run The World!

This is a Discord bot being developed to promote the health of small groups of friends.

I'm making this for my friend who keeps forgetting to take her daily medication.

By sharing your goals with friends, you can keep yourself motivated!

---

When a user inputs their desired time range, their goal, time zone, and a preferred emoji via `register` command, it is recorded on the board.

At the start of the time range, the app sends a message tagging the user to notify them that it's time to execute the goal with the selected emoji.

When a user sends a reaction via emoji in the time range, a success message is sent. Even if it falls outside the specified time range, if the reaction was performed before midnight in that time zone, an encouragement message is sent.

Reactions can only be recorded once per day, and reactions made by other users will be deleted.

Using `stats` command, user can find out their goal success rate. Using `stats_all` command, it shows the success rate for all users over the past 7 days.

User can change the selected time zone using `settimezone` command. This will support PST, EST, and KST, and I plan to add other time zones after all functions are implemented.

## Skills
- JavaScript
- node.js

## Example of Execution

To be modified later.

---

Paissa is the creature from Final Fantasy XIV that my friend, who inspired me to create this bot, loves the most.

This project is not affiliated with Square Enix.

