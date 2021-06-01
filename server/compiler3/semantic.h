#pragma once
#include "env.h"
#include "tree.h"

struct expty {Tr_exp exp; Ty_ty ty;};

struct expty expTy(Tr_exp exp, Ty_ty ty);

struct expty transStm(S_table venv, S_table tenv, A_stm s, Tr_level level);
struct expty transVar(S_table venv, S_table tenv, A_var v, Tr_level level);
struct expty transExp(S_table venv, S_table tenv, A_exp e, Tr_level level);
T_module       transDec(S_table venv, S_table tenv, A_dec d, Tr_level level);
Ty_ty        transTy (              S_table tenv, A_ty  ty);

T_moduleList SEM_transProg(A_decList declist);