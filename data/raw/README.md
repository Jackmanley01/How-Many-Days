# Raw form export (never committed)

Put the Google Sheet export of the stays form here as `form.csv`
(in Google Sheets: File → Download → Comma-separated values).

Then run `npm run import`. It writes `data/stays.csv` and prints a report.

Git ignores everything in this folder except this note, because the export
contains email addresses.
