#!/usr/bin/env python3
"""
Rate Limit Metrics Validator
Checks if Prometheus metrics are properly exposed and tracking rate limit events
"""

import requests
import time
import sys
from datetime import datetime

METRICS_URL = 'http://localhost:3000/metrics'
TIMEOUT = 5

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def fetch_metrics():
    """Fetch metrics from backend"""
    try:
        print_info(f"Fetching metrics from {METRICS_URL}...")
        resp = requests.get(METRICS_URL, timeout=TIMEOUT)
        
        if resp.status_code != 200:
            print_error(f"HTTP {resp.status_code} - Expected 200")
            return None
            
        print_success(f"Metrics endpoint responding (HTTP 200)")
        return resp.text
        
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to {METRICS_URL}")
        print_info("Make sure backend is running on port 3000")
        return None
    except requests.exceptions.Timeout:
        print_error(f"Request timeout after {TIMEOUT}s")
        return None
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return None

def check_rate_limit_metrics(content):
    """Verify rate limit metrics exist"""
    print_header("Rate Limit Metrics Check")
    
    metrics_found = {
        'rate_limit_blocked_total': False,
        'rate_limit_allowed_total': False,
    }
    
    metric_values = {
        'rate_limit_blocked_total': [],
        'rate_limit_allowed_total': [],
    }
    
    for line in content.split('\n'):
        # Check for rate limit metrics (including in HELP/TYPE comments)
        for metric_name in metrics_found.keys():
            if metric_name in line:
                metrics_found[metric_name] = True
                # Only save non-comment lines with actual values
                if not line.startswith('#') and line.strip():
                    metric_values[metric_name].append(line)
    
    # Report findings
    all_found = True
    for metric_name, found in metrics_found.items():
        if found:
            print_success(f"Metric '{metric_name}' declared")
            # Print values if any
            if metric_values[metric_name]:
                for value_line in metric_values[metric_name]:
                    print(f"    {value_line}")
            else:
                print_info(f"    No values yet (counter not incremented)")
        else:
            print_error(f"Metric '{metric_name}' NOT FOUND")
            all_found = False
    
    return all_found

def check_cache_metrics(content):
    """Verify cache metrics exist"""
    print_header("Cache Metrics Check")
    
    metrics_found = {
        'cache_hits_total': False,
        'cache_misses_total': False,
    }
    
    for line in content.split('\n'):
        if line.startswith('#') or not line.strip():
            continue
            
        for metric_name in metrics_found.keys():
            if line.startswith(metric_name):
                metrics_found[metric_name] = True
    
    # Report findings
    for metric_name, found in metrics_found.items():
        if found:
            print_success(f"Metric '{metric_name}' found")
        else:
            print_info(f"Metric '{metric_name}' not found (optional)")
    
    return True  # Cache metrics are optional

def check_process_metrics(content):
    """Verify Node.js process metrics exist"""
    print_header("Process Metrics Check")
    
    key_metrics = [
        'process_cpu_user_seconds_total',
        'process_resident_memory_bytes',
        'nodejs_heap_size_used_bytes',
    ]
    
    found_count = 0
    for metric_name in key_metrics:
        if metric_name in content:
            found_count += 1
            print_success(f"Metric '{metric_name}' found")
    
    if found_count == len(key_metrics):
        print_success("All key process metrics found")
        return True
    else:
        print_error(f"Only {found_count}/{len(key_metrics)} process metrics found")
        return False

def extract_metric_value(content, metric_name):
    """Extract numeric value from a counter metric"""
    for line in content.split('\n'):
        if line.startswith(metric_name) and not line.startswith('#'):
            # Format: metric_name{labels} value
            parts = line.split()
            if len(parts) >= 2:
                try:
                    return float(parts[-1])
                except ValueError:
                    pass
    return 0

def check_metric_values(content):
    """Check actual metric values"""
    print_header("Metric Values Analysis")
    
    blocked = extract_metric_value(content, 'rate_limit_blocked_total')
    allowed = extract_metric_value(content, 'rate_limit_allowed_total')
    
    print(f"Rate Limit Blocked:  {int(blocked)} requests")
    print(f"Rate Limit Allowed:  {int(allowed)} requests")
    
    if blocked == 0 and allowed == 0:
        print_info("No requests tracked yet - metrics initialized but not used")
        print_info("This is normal if:")
        print_info("  - Backend just started")
        print_info("  - No traffic yet")
        print_info("  - Rate limiter is disabled")
    elif blocked > 0:
        print_success(f"Rate limiter is actively blocking requests")
        block_rate = (blocked / (blocked + allowed)) * 100 if (blocked + allowed) > 0 else 0
        print(f"    Block rate: {block_rate:.2f}%")
    else:
        print_success(f"Requests being allowed (no blocks yet)")
    
    return True

def check_rate_limiter_status():
    """Check if rate limiter is enabled via logs"""
    print_header("Rate Limiter Status")
    
    try:
        import subprocess
        result = subprocess.run(
            ['docker-compose', 'logs', '--tail', '20', 'backend'],
            capture_output=True,
            text=True,
            cwd='d:\\Web js\\Book-Sharing',
            timeout=10
        )
        
        logs = result.stdout + result.stderr
        
        if 'Rate limiter enabled' in logs:
            print_success("Rate limiter is ENABLED")
            return True
        elif 'Rate limiter disabled' in logs:
            print_info("Rate limiter is DISABLED")
            print_info("  Metrics will not increment during load tests")
            print_info("  Enable in docker-compose.yml: RATE_LIMIT_ENABLED=true")
            return False
        else:
            print_info("Could not determine rate limiter status from logs")
            return None
            
    except subprocess.TimeoutExpired:
        print_error("Docker command timeout")
        return None
    except FileNotFoundError:
        print_info("docker-compose not found - skipping status check")
        return None
    except Exception as e:
        print_info(f"Could not check status: {e}")
        return None

def main():
    """Main validation flow"""
    print_header(f"Rate Limit Metrics Validation")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Fetch metrics
    content = fetch_metrics()
    if not content:
        print_error("\nValidation FAILED - Cannot fetch metrics")
        return 1
    
    # Run checks
    checks = [
        check_rate_limit_metrics(content),
        check_cache_metrics(content),
        check_process_metrics(content),
        check_metric_values(content),
    ]
    
    # Check rate limiter status
    check_rate_limiter_status()
    
    # Summary
    print_header("Validation Summary")
    
    if all(checks):
        print_success("All critical checks PASSED ✓")
        print_success("\nRate limit metrics are properly configured!")
        print_info("\nNext steps:")
        print_info("  1. Enable rate limiter (if disabled)")
        print_info("  2. Run Locust load test: http://localhost:8089")
        print_info("  3. Monitor metrics in Prometheus: http://localhost:9090")
        print_info("  4. Visualize in Grafana: http://localhost:3001")
        return 0
    else:
        print_error("Some checks FAILED ✗")
        print_error("\nPlease verify:")
        print_error("  1. Backend is running")
        print_error("  2. Metrics are properly exported in backend/utils/metrics.js")
        print_error("  3. Metrics endpoint is accessible")
        return 1

if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nValidation interrupted by user")
        sys.exit(130)
