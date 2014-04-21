web: -m 5 --minUptime 1000 --spinSleepTime 500 -a -l "$log_dir/server-forever.log" -o "$log_dir/server.log" -e "$log_dir/server-error.log" server.js
daemon: -m 5 --minUptime 2000 --spinSleepTime 1000 -a -l "$log_dir/results-forever.log" -o "$log_dir/results.log" -e "$log_dir/results-error.log" scripts/fetchResults.js
