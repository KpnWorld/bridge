#!/bin/bash
set -e

# Install frontend dependencies
npm --prefix portal install --legacy-peer-deps

# Install backend dependencies
pip install -r backend/requirements.txt -q
