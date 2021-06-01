#include "escape.h"

static void traverseStm(S_table env, int depth, A_stm stm);
static void traverseExp(S_table env, int depth, A_exp eexp);
static void traverseDec(S_table env, int depth, A_dec dec);
static void traverseVar(S_table env, int depth, A_var var);

void ESC_findEscape(A_exp exp)
{

}

bool ESC_checkEscapeFromType(Ty_ty type)
{
    bool result = FALSE;
    if(type->kind == Ty_name)
    {
        if(type -> u.name.sym == S_Symbol("real") || type -> u.name.sym == S_Symbol("int") || type -> u.name.sym == S_Symbol("bool"))
        {
            result = FALSE;
        }
        else
        {
            result = TRUE;
        }
    }
    else if(type -> kind == Ty_int || type -> kind == Ty_real || type -> kind == Ty_bool)
    {
        result = FALSE;
    }
    else
    {
        result = TRUE;
    }
    return result;
}