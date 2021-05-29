#pragma once
#include "errormsg.h"
#include "types.h"
#include "symbol.h"
#include "absyn.h"
#include "translate.h"

extern int funcs;
typedef struct E_enventry_ *E_enventry;

struct E_enventry_ 
{
    enum {E_varentry, E_funcentry} kind;
    union
    {
        struct {Ty_ty ty; Tr_access access;} var;
        struct {Ty_tyList formals; Ty_ty result; Tr_level level; Temp_label label; int index; } func;
    } u;
};

E_enventry E_VarEntry(Tr_access access, Ty_ty ty);
E_enventry E_FuncEntry(Tr_level level, Temp_label label, Ty_tyList params, Ty_ty result);

//default types
S_table E_base_tenv(void);
//default functions
S_table E_base_fenv(void);