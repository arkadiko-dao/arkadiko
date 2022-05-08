;; A governance vote to decide vault stacking rewards will be paid per the following logic:


;; At the time of vault payouts of STX stacking rewards...

;; IF the oracle on Arkadiko lists USDA value as less than $0.99
;; THEN STX to be paid out will be converted to USDA via the USDA/STX Arkadiko liquidity pool in increments of 10,000 STX
;; UNTIL whichever of these two criteria occurs first....
;; EITHER converting more STX to USDA would make the implied USDA price greater than $1.01
;; OR all STX to be paid out has been converted into USDA
;; THEN rewards are paid to vault stackers in the form of USDA and any remaining STX

;; ELSE, if the oracle on Arkadiko lists USDA value as greater than or equal to $0.99
;; THEN rewards are paid to stackers entirely in the form of STX (identical to the current payouts logic)

;; Vote FOR if you agree
;; Vote AGAINST if you disagree
