#!/usr/bin/env python3
"""
tr_auth.py — Trade Republic device reset authentication.

Two-step flow (required when stored credentials + session are both invalid):

  Step 1: python3 tr_auth.py request
    - Initiates device reset using stored phone/pin
    - TR sends a 4-digit code as push notification to the TR app
    - Saves process state to /tmp/tr_reset_state.json

  Step 2: python3 tr_auth.py complete <4-digit-code>
    - Loads process state from /tmp/tr_reset_state.json
    - Completes device reset with the code from the TR app
    - Calls api.login() to get a new session
    - Prints AUTH_OK on success, AUTH_FAIL on error
"""
import json
import sys
import hashlib
from pathlib import Path

STATE_FILE = Path('/tmp/tr_reset_state.json')


def cmd_request():
    """Initiate device reset — TR sends 4-digit code to app."""
    from pytr.api import TradeRepublicApi
    from ecdsa import SigningKey, NIST256p

    api = TradeRepublicApi(save_cookies=True)

    # Check if session is still valid
    try:
        ok = api.resume_websession()
        if ok:
            print('SESSION_OK: Bestehende Session noch gültig.')
            return
    except Exception:
        pass

    # Try simple re-login first (uses stored phone+pin)
    try:
        api.login()
        print('SESSION_OK: Login mit gespeicherten Credentials erfolgreich.')
        return
    except Exception:
        pass

    # Need full device reset
    print('Initiiere Device Reset (TR sendet Code an App)...')
    api.initiate_device_reset()

    # Save state (process_id + new private key) for the complete step
    state = {
        'process_id': api._process_id,
        'private_key_pem': api.sk.to_pem().decode('utf-8'),
    }
    STATE_FILE.write_text(json.dumps(state))
    print('RESET_REQUESTED: Code wurde an die TR App gesendet. Bitte warte auf die Push-Benachrichtigung.')


def cmd_complete(code: str):
    """Complete device reset with the 4-digit code from the TR app."""
    if not STATE_FILE.exists():
        print('AUTH_FAIL: Kein offener Reset-Prozess gefunden. Bitte zuerst "request" aufrufen.')
        sys.exit(1)

    try:
        state = json.loads(STATE_FILE.read_text())
    except Exception as e:
        print(f'AUTH_FAIL: Fehler beim Lesen des State: {e}')
        sys.exit(1)

    from pytr.api import TradeRepublicApi
    from ecdsa import SigningKey, NIST256p

    api = TradeRepublicApi(save_cookies=True)
    api._process_id = state['process_id']
    api.sk = SigningKey.from_pem(state['private_key_pem'].encode(), hashfunc=hashlib.sha512)

    print(f'Schließe Device Reset mit Code {code} ab...')
    try:
        api.complete_device_reset(code)
    except Exception as e:
        print(f'AUTH_FAIL: Device Reset fehlgeschlagen — {e}')
        STATE_FILE.unlink(missing_ok=True)
        sys.exit(1)

    # Now login with the new key
    try:
        api.login()
    except Exception as e:
        print(f'AUTH_FAIL: Login nach Device Reset fehlgeschlagen — {e}')
        sys.exit(1)

    STATE_FILE.unlink(missing_ok=True)
    print('AUTH_OK: Device Reset und Login erfolgreich.')


def main():
    args = sys.argv[1:]
    if not args:
        print('Usage: tr_auth.py request | tr_auth.py complete <code>')
        sys.exit(1)

    cmd = args[0].lower()

    if cmd == 'request':
        cmd_request()
    elif cmd == 'complete':
        if len(args) < 2:
            print('AUTH_FAIL: Kein Code angegeben. Usage: tr_auth.py complete <code>')
            sys.exit(1)
        code = args[1].strip()
        if not code.isdigit() or len(code) not in (4, 6):
            print('ERROR: Ungültiger Code. Bitte 4- oder 6-stelligen TR-Code eingeben.')
            sys.exit(1)
        cmd_complete(code)
    else:
        print(f'Unbekannter Befehl: {cmd}')
        sys.exit(1)


if __name__ == '__main__':
    main()
