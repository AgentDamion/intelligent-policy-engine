#!/usr/bin/env node

/**
 * Direct Supabase Migration Runner
 * This script directly executes migrations through the Supabase client
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... rest of the code stays the same, just remove 'require' statements
