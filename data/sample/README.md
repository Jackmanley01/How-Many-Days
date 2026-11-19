# Sample data (made up)

Every row in `stays.csv` is invented, for building and testing the site only.
Any page built from this file must show a "Sample data" badge.
None of these numbers describe the real towns.

The three towns are sized on purpose to cover each confidence level:

| Town | Rows | Eligible (last 24 months) | What the page should show |
| --- | --- | --- | --- |
| Pai | 34 | 32 | One number |
| Chiang Mai | 18 | 17 | A range labelled "Early data" |
| Hoi An | 8 | 8 | "Not enough stays yet. Add yours." |

A few rows are dated 2024 so they fall outside the 24-month window.
`styles` is a semicolon-separated list. Empty `nightsPlanned` means "Hadn't planned".
Empty `month` means the traveller left it blank.
