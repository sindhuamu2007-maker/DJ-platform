import sys
sys.stdout.reconfigure(encoding='utf-8')
import app

print("AI Engine initialized successfully!")
routes = [rule.rule for rule in app.app.url_map.iter_rules()]
print("Available routes:", routes)
