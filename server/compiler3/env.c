#include "env.h"

int funcs;

E_enventry E_VarEntry(Tr_access access, Ty_ty ty)
{
    E_enventry p = checked_malloc(sizeof(*p));
    p -> kind = E_varentry;
    p -> u.var.ty = ty;
    p -> u.var.access = access;
    return p;
}
E_enventry E_FuncEntry(Tr_level level, Temp_label label, Ty_tyList params, Ty_ty result)
{
    E_enventry p = checked_malloc(sizeof(*p));
    p -> kind = E_funcentry;
    p -> u.func.formals = params;
    p -> u.func.result = result;
    p -> u.func.level = level;
    p -> u.func.label = label;
    p -> u.func.index = funcs;
    funcs++;
    return p;
}

//default types
S_table E_base_tenv(void)
{
    S_table tenv = S_empty();
    return tenv;
}
//default functions
S_table E_base_fenv(void)
{
    funcs = 0;
    S_table venv = S_empty();
    Ty_tyList list = checked_malloc(sizeof(*list));
    Ty_tyList result = list;
    list -> head = Ty_Real();
    list -> tail = checked_malloc(sizeof(*list));
    list = list -> tail;
    list -> head = NULL;
    list -> tail = NULL;
    S_enter(venv, S_Symbol("出力"), E_FuncEntry(Tr_outermost(), Temp_namedlabel("出力"), result, Ty_Void()));
    Ty_tyList drawList = checked_malloc(sizeof(*drawList));
    Ty_tyList drawResult = drawList;
    drawList -> head = Ty_Int();
    drawList -> tail = checked_malloc(sizeof(*drawList));
    drawList = drawList -> tail;
    drawList -> head = Ty_Int();
    drawList -> tail = checked_malloc(sizeof(*drawList));
    drawList = drawList -> tail;
    drawList -> head = Ty_Int();
    drawList -> tail = checked_malloc(sizeof(*drawList));
    drawList = drawList -> tail;
    drawList -> head = NULL;
    drawList -> tail = NULL;
    S_enter(venv, S_Symbol("描画"), E_FuncEntry(Tr_outermost(), Temp_namedlabel("描画"), drawResult, Ty_Void()));
    return venv;
}