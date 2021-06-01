#pragma once
#include "absyn.h"
#include "symbol.h"
#include "types.h"

void ESC_findEscape(A_exp exp);
bool ESC_checkEscapeFromType(Ty_ty type);