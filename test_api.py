#!/usr/bin/env python3
"""
Test script for the Bug Risk Assessment API.
"""

import requests
import json
import time
from pathlib import Path

# Test configuration
API_BASE_URL = "http://localhost:8000"
TEST_DIFF = """diff --git a/test_file.py b/test_file.py
index 1234567..abcdefg 100644
--- a/test_file.py
+++ b/test_file.py
@@ -1,5 +1,5 @@
 def example_function():
-    return None
+    return 42
 
 def another_function():
     pass
"""


def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Model Loaded: {data.get('model_loaded')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection failed - API not running")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_diff_validation():
    """Test the diff validation endpoint"""
    print("\n🔍 Testing diff validation...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/validate-diff",
            json={"raw_diff": TEST_DIFF, "file_path": "test_file.py"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Valid: {data.get('is_valid')}")
            print(f"   Message: {data.get('message')}")
            if data.get('file_info'):
                file_info = data['file_info']
                print(f"   Files Changed: {file_info.get('files_changed')}")
                print(f"   Additions: {file_info.get('additions')}")
                print(f"   Deletions: {file_info.get('deletions')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_single_risk_assessment():
    """Test the single risk assessment endpoint"""
    print("\n🔍 Testing single risk assessment...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/assess-risk",
            json={"raw_diff": TEST_DIFF, "file_path": "test_file.py"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Risk Score: {data.get('risk_score')}%")
            print(f"   Risk Level: {data.get('risk_level')}")
            print(f"   Confidence: {data.get('confidence')}")
            print(f"   Explanation: {data.get('explanation')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_batch_risk_assessment():
    """Test the batch risk assessment endpoint"""
    print("\n🔍 Testing batch risk assessment...")
    
    # Create multiple test diffs
    test_diffs = [
        {
            "raw_diff": TEST_DIFF,
            "file_path": "test_file1.py"
        },
        {
            "raw_diff": """diff --git a/test_file2.py b/test_file2.py
index 1234567..abcdefg 100644
--- a/test_file2.py
+++ b/test_file2.py
@@ -1,3 +1,3 @@
 def test_function():
-    x = 1
+    x = 2
     return x""",
            "file_path": "test_file2.py"
        }
    ]
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/assess-risk-batch",
            json={"diffs": test_diffs}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Total Processed: {data.get('total_processed')}")
            print(f"   Processing Time: {data.get('processing_time'):.3f}s")
            
            assessments = data.get('assessments', [])
            for i, assessment in enumerate(assessments):
                print(f"   Diff {i+1}: {assessment.get('risk_score')}% ({assessment.get('risk_level')})")
            
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_model_info():
    """Test the model info endpoint"""
    print("\n🔍 Testing model info...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/model-info")
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Model Path: {data.get('model_path')}")
            print(f"   Model Type: {data.get('model_type')}")
            print(f"   Framework: {data.get('framework')}")
            print(f"   Max Model Length: {data.get('max_model_len')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def run_all_tests():
    """Run all API tests"""
    print("🧪 Running Bug Risk Assessment API Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Diff Validation", test_diff_validation),
        ("Single Risk Assessment", test_single_risk_assessment),
        ("Batch Risk Assessment", test_batch_risk_assessment),
        ("Model Info", test_model_info)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"   ❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed")
        return False


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Bug Risk Assessment API")
    parser.add_argument(
        "--url",
        default=API_BASE_URL,
        help="API base URL (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--test",
        choices=["health", "validation", "single", "batch", "info", "all"],
        default="all",
        help="Specific test to run (default: all)"
    )
    
    args = parser.parse_args()
    
    global API_BASE_URL
    API_BASE_URL = args.url
    
    if args.test == "all":
        run_all_tests()
    elif args.test == "health":
        test_health_check()
    elif args.test == "validation":
        test_diff_validation()
    elif args.test == "single":
        test_single_risk_assessment()
    elif args.test == "batch":
        test_batch_risk_assessment()
    elif args.test == "info":
        test_model_info()


if __name__ == "__main__":
    main()
